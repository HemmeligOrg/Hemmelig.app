import { zValidator } from '@hono/zod-validator';
import crypto from 'crypto';
import { Hono } from 'hono';
import { z } from 'zod';
import { auth, SETUP_CLAIM_HEADER, SETUP_HEADER, SETUP_TOKEN } from '../auth';
import {
    hashSetupClaimToken,
    safeSecretEqual,
    SETUP_CLAIM_ID,
    SETUP_CLAIM_TTL_MS,
} from '../lib/claim';
import prisma from '../lib/db';
import { deleteUserWithRetries, prismaErrorHasCode } from '../lib/user-rollback';
import { passwordSchema } from '../validations/password';

const setupSchema = z.object({
    email: z.string().email(),
    password: passwordSchema,
    username: z.string().min(3).max(32),
    name: z.string().min(1).max(100),
});

// Retry policy for provisioning the first admin (role promotion + settings bootstrap),
// so a transient SQLite lock does not fail the whole setup.
const PROVISIONING_ATTEMPTS = 3;
const PROVISIONING_DELAYS_MS = [50, 100, 200];

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
        const claimToken: string = crypto.randomUUID();
        // Only the SHA-256 digest of the claim token is persisted (CWE-312); the raw
        // token stays in-process and all comparisons are constant time (CWE-208).
        const claimTokenHash: string = hashSetupClaimToken(claimToken);
        let createdUserId: string | null = null;
        let setupClaimCreated: boolean = false;
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
                        id: SETUP_CLAIM_ID,
                        expiresAt: { lt: new Date() },
                    },
                })
                .catch(() => {});

            // Atomically acquire the single-use setup claim via the unique sentinel row
            try {
                await prisma.verification.create({
                    data: {
                        id: SETUP_CLAIM_ID,
                        identifier: 'setup',
                        value: claimTokenHash,
                        expiresAt: new Date(Date.now() + SETUP_CLAIM_TTL_MS),
                    },
                });
                setupClaimCreated = true;
            } catch (err: unknown) {
                if (prismaErrorHasCode(err, 'P2002')) {
                    // Unique constraint on the sentinel row: another in-flight request
                    // currently owns the setup claim (CWE-362 mutual exclusion).
                    return c.json(
                        { error: 'Setup is already in progress. Please try again in a moment.' },
                        403
                    );
                }
                throw err;
            }

            const { email, password, username, name } = c.req.valid('json');

            const preCheckClaim = await prisma.verification.findUnique({
                where: { id: SETUP_CLAIM_ID },
            });
            if (
                !preCheckClaim ||
                !safeSecretEqual(preCheckClaim.value, claimTokenHash) ||
                preCheckClaim.expiresAt < new Date()
            ) {
                return c.json(
                    { error: 'Setup claim expired or was preempted by another request' },
                    403
                );
            }

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
                    [SETUP_CLAIM_HEADER]: claimToken,
                },
            });

            if (!result.user) {
                await prisma.verification
                    .deleteMany({
                        where: {
                            id: SETUP_CLAIM_ID,
                            value: claimTokenHash,
                        },
                    })
                    .catch(() => {});
                return c.json({ error: 'Failed to create admin user' }, 500);
            }

            createdUserId = result.user.id;

            // Verify the setup claim is still active and owned by this exact request
            const activeClaim = await prisma.verification.findUnique({
                where: { id: SETUP_CLAIM_ID },
            });
            if (!activeClaim || !safeSecretEqual(activeClaim.value, claimTokenHash)) {
                throw new Error('Setup claim expired or was preempted by another request');
            }

            // Promote the user to admin and bootstrap instance settings, retrying
            // transient SQLite lock errors before falling back to the rollback path.
            let provisioned = false;
            for (let attempt = 0; attempt < PROVISIONING_ATTEMPTS; attempt++) {
                try {
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

                    provisioned = true;
                    break;
                } catch (provisionErr) {
                    if (attempt === PROVISIONING_ATTEMPTS - 1) {
                        console.error(
                            `Failed to provision admin user ${result.user.id}:`,
                            provisionErr
                        );
                    } else {
                        await new Promise((resolve) =>
                            setTimeout(resolve, PROVISIONING_DELAYS_MS[attempt])
                        );
                    }
                }
            }
            if (!provisioned) {
                throw new Error('Failed to promote user to admin and initialize instance settings');
            }

            // Clean up setup claim sentinel (ownership-fenced delete)
            await prisma.verification
                .deleteMany({
                    where: {
                        id: SETUP_CLAIM_ID,
                        value: claimTokenHash,
                    },
                })
                .catch(() => {});

            return c.json({
                success: true,
                message: 'Setup completed successfully',
            });
        } catch (error) {
            if (createdUserId) {
                const rolledBack = await deleteUserWithRetries(createdUserId);
                if (!rolledBack) {
                    // Last-resort recovery: setup cannot be re-run while any user exists,
                    // so a surviving non-admin user would leave the instance permanently
                    // without an admin. Promote the orphaned account instead. This grants
                    // no new actor access (the account was created by this very setup
                    // request) and keeps the instance operable; the incident stays
                    // visible in logs.
                    try {
                        await prisma.user.update({
                            where: { id: createdUserId },
                            data: { role: 'admin' },
                        });
                        console.warn(
                            `Setup rollback failed for user ${createdUserId}; promoted the orphaned account to admin as last-resort recovery.`
                        );
                    } catch (promoteErr) {
                        console.error(
                            `CRITICAL: Could not delete or promote orphaned setup user ${createdUserId}; the instance may be left without an admin.`,
                            promoteErr
                        );
                    }
                }
            }
            if (setupClaimCreated) {
                await prisma.verification
                    .deleteMany({
                        where: {
                            id: SETUP_CLAIM_ID,
                            value: claimTokenHash,
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
