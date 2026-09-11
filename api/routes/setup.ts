import { zValidator } from '@hono/zod-validator';
import crypto from 'crypto';
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
        const claimToken = crypto.randomUUID();
        let createdUserId: string | null = null;
        let setupClaimCreated = false;
        try {
            // Check if any users already exist
            const userCount = await prisma.user.count();
            if (userCount > 0) {
                return c.json({ error: 'Setup already completed' }, 403);
            }

            // Clean up any expired/abandoned setup claim
            await prisma.verification
                .deleteMany({
                    where: {
                        id: 'initial-setup-claim',
                        expiresAt: { lt: new Date() },
                    },
                })
                .catch(() => {});

            // Atomically acquire single-use setup claim using unique sentinel row
            try {
                await prisma.verification.create({
                    data: {
                        id: 'initial-setup-claim',
                        identifier: 'setup',
                        value: claimToken,
                        expiresAt: new Date(Date.now() + 60000),
                    },
                });
                setupClaimCreated = true;
            } catch (err: unknown) {
                if (
                    err &&
                    typeof err === 'object' &&
                    'code' in err &&
                    (err as { code: string }).code === 'P2002'
                ) {
                    return c.json({ error: 'Setup already completed' }, 403);
                }
                throw err;
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
                    .deleteMany({
                        where: {
                            id: 'initial-setup-claim',
                            value: claimToken,
                        },
                    })
                    .catch(() => {});
                return c.json({ error: 'Failed to create admin user' }, 500);
            }

            createdUserId = result.user.id;

            // Verify setup claim is still active and owned by this exact request
            const activeClaim = await prisma.verification.findUnique({
                where: { id: 'initial-setup-claim' },
            });
            if (!activeClaim || activeClaim.value !== claimToken) {
                throw new Error('Setup claim expired or was preempted by another request');
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
                .deleteMany({
                    where: {
                        id: 'initial-setup-claim',
                        value: claimToken,
                    },
                })
                .catch(() => {});

            return c.json({
                success: true,
                message: 'Setup completed successfully',
            });
        } catch (error) {
            if (createdUserId) {
                const delays = [50, 100, 200];
                let rollbackSuccess = false;
                let err: unknown;
                for (let attempt = 0; attempt < delays.length; attempt++) {
                    try {
                        await prisma.user.delete({ where: { id: createdUserId } });
                        rollbackSuccess = true;
                        break;
                    } catch (rollbackErr) {
                        err = rollbackErr;
                        if (attempt < delays.length - 1) {
                            await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
                        }
                    }
                }
                if (!rollbackSuccess) {
                    console.error(
                        `CRITICAL: Failed to rollback user ${createdUserId} during setup failure:`,
                        err
                    );
                }
            }
            if (setupClaimCreated) {
                await prisma.verification
                    .deleteMany({
                        where: {
                            id: 'initial-setup-claim',
                            value: claimToken,
                        },
                    })
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
