import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { auth, bootstrap } from '../auth';
import prisma from '../lib/db';
import { passwordSchema } from '../validations/password';

const setupSchema = z.object({
    email: z.string().email(),
    password: passwordSchema,
    username: z.string().min(3).max(32),
    name: z.string().min(1).max(100),
});

// Serialize setup completion so concurrent requests cannot both create an
// administrator. SQLite deployments run a single server process.
let setupQueue: Promise<unknown> = Promise.resolve();

const serializeSetup = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = setupQueue.then(operation, operation);
    setupQueue = result.then(
        () => undefined,
        () => undefined
    );
    return result;
};

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
        return serializeSetup(async () => {
            try {
                // Check if any users already exist
                const userCount = await prisma.user.count();
                if (userCount > 0) {
                    return c.json({ error: 'Setup already completed' }, 403);
                }

                const { email, password, username, name } = c.req.valid('json');

                // Create the admin user using better-auth
                bootstrap.inProgress = true;
                let result;
                try {
                    result = await auth.api.signUpEmail({
                        body: {
                            email,
                            password,
                            name,
                            username,
                        },
                    });
                } finally {
                    bootstrap.inProgress = false;
                }

                if (!result.user) {
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

                return c.json({
                    success: true,
                    message: 'Setup completed successfully',
                });
            } catch (error) {
                console.error('Failed to complete setup:', error);
                return c.json(
                    {
                        error: 'Failed to complete setup',
                    },
                    500
                );
            }
        });
    });

export default app;
