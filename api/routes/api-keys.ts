import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { createHash, randomBytes } from 'crypto';
import prisma from '../lib/db';
import { authMiddleware } from '../middlewares/auth';
import { auth } from '../auth';

const createApiKeySchema = z.object({
    name: z.string().min(1).max(100),
    expiresInDays: z.number().int().min(1).max(365).optional(),
});

const deleteApiKeySchema = z.object({
    id: z.string(),
});

function hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
}

function generateApiKey(): string {
    const prefix = 'hemmelig';
    const key = randomBytes(24).toString('base64url');
    return `${prefix}_${key}`;
}

const app = new Hono<{
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
    }
}>()
    .use(authMiddleware)
    .get('/', async (c) => {
        const user = c.get('user');
        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        try {
            const apiKeys = await prisma.apiKey.findMany({
                where: { userId: user.id },
                select: {
                    id: true,
                    name: true,
                    keyPrefix: true,
                    lastUsedAt: true,
                    expiresAt: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            });

            return c.json(apiKeys);
        } catch (error) {
            console.error('Failed to list API keys:', error);
            return c.json({ error: 'Failed to list API keys' }, 500);
        }
    })
    .post('/', zValidator('json', createApiKeySchema), async (c) => {
        const user = c.get('user');
        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const { name, expiresInDays } = c.req.valid('json');

        try {
            // Check API key limit (max 5 per user)
            const existingCount = await prisma.apiKey.count({
                where: { userId: user.id },
            });

            if (existingCount >= 5) {
                return c.json({ error: 'Maximum API key limit reached (5)' }, 400);
            }

            const rawKey = generateApiKey();
            const keyHash = hashApiKey(rawKey);
            const keyPrefix = rawKey.substring(0, 16);

            const expiresAt = expiresInDays
                ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
                : null;

            const apiKey = await prisma.apiKey.create({
                data: {
                    name,
                    keyHash,
                    keyPrefix,
                    userId: user.id,
                    expiresAt,
                },
                select: {
                    id: true,
                    name: true,
                    keyPrefix: true,
                    expiresAt: true,
                    createdAt: true,
                },
            });

            // Return the raw key only once - it cannot be retrieved again
            return c.json({
                ...apiKey,
                key: rawKey,
            }, 201);
        } catch (error) {
            console.error('Failed to create API key:', error);
            return c.json({ error: 'Failed to create API key' }, 500);
        }
    })
    .delete('/:id', zValidator('param', deleteApiKeySchema), async (c) => {
        const user = c.get('user');
        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const { id } = c.req.valid('param');

        try {
            // Ensure the API key belongs to the user
            const apiKey = await prisma.apiKey.findFirst({
                where: { id, userId: user.id },
            });

            if (!apiKey) {
                return c.json({ error: 'API key not found' }, 404);
            }

            await prisma.apiKey.delete({ where: { id } });

            return c.json({ success: true });
        } catch (error) {
            console.error('Failed to delete API key:', error);
            return c.json({ error: 'Failed to delete API key' }, 500);
        }
    });

export default app;

// Export helper for middleware
export { hashApiKey };
