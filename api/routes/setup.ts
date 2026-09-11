import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { auth, SETUP_HEADER, SETUP_TOKEN } from '../auth';
import prisma from '../lib/db';
import { passwordSchema } from '../validations/password';

const setupSchema = z.object({
    email: z.string().email(),
    password: passwordSchema,
    username: z.string().min(3).max(32),
    name: z.string().min(1).max(100),
});

const app = new Hono()
    // Check if setup is needed (no users exist)
    .get('/status', async (c) => {
        try {
            const userCount = await prisma.user.count();
            return c.json({
                needsSetup: userCount === 0,
            });
        } catch (error) {
            console.error('Failed to check setup status:', error);
            return c.json({ error: 'Failed to check setup status' }, 500);
        }
    })
    // Complete initial setup - create first admin user
    .post('/complete', zValidator('json', setupSchema), async (c) => {
        let setupClaimCreated = false;
        try {
            // Check if any users already exist
            const userCount = await prisma.user.count();
            if (userCount > 0) {
                return c.json({ error: 'Setup already completed' }, 403);
            }

            // Atomically acquire single-use setup claim using unique sentinel row
            try {
                await prisma.verification.create({
                    data: {
                        id: 'initial-setup-claim',
                        identifier: 'setup',
                        value: 'claimed',
                        expiresAt: new Date(Date.now() + 60000),
                    },
                });
                setupClaimCreated = true;
            } catch {
                // Another concurrent request has already claimed initial setup
                return c.json({ error: 'Setup already completed' }, 403);
            }

            const { email, password, username, name } = c.req.valid('json');

            // Create the admin user using better-auth
            const result = await auth.api.signUpEmail({
                body: {
                    email,
                    password,
                    name,
                    username,
                },
                headers: {
                    [SETUP_HEADER]: SETUP_TOKEN,
                },
            });

            if (!result.user) {
                await prisma.verification
                    .delete({ where: { id: 'initial-setup-claim' } })
                    .catch(() => {});
                return c.json({ error: 'Failed to create admin user' }, 500);
            }

            // Update user to be admin
            await prisma.user.update({
                where: { id: result.user.id },
                data: { role: 'admin' },
            });

            // Create initial instance settings if not exists
            const existingSettings = await prisma.instanceSettings.findFirst();
            if (!existingSettings) {
                await prisma.instanceSettings.create({
                    data: {},
                });
            }

            // Clean up setup claim sentinel
            await prisma.verification
                .delete({ where: { id: 'initial-setup-claim' } })
                .catch(() => {});

            return c.json({
                success: true,
                message: 'Setup completed successfully',
            });
        } catch (error) {
            if (setupClaimCreated) {
                await prisma.verification
                    .delete({ where: { id: 'initial-setup-claim' } })
                    .catch(() => {});
            }
            console.error('Failed to complete setup:', error);
            return c.json(
                {
                    error: 'Failed to complete setup',
                },
                500
            );
        }
    });

export default app;
