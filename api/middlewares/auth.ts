import { createMiddleware } from 'hono/factory';
import { createHash } from 'crypto';
import { auth } from '../auth';
import prisma from '../lib/db';

type Env = {
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
        session: typeof auth.$Infer.Session.session | null
    }
}

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
});

export const checkAdmin = createMiddleware<Env>(async (c, next) => {
    const sessionUser = c.get('user');
    if (!sessionUser) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { role: true }
    });

    if (!user || user.role !== 'admin') {
        return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
});

// Middleware that accepts either session auth OR API key auth
export const apiKeyOrAuthMiddleware = createMiddleware<Env>(async (c, next) => {
    // First check if user is already authenticated via session
    const sessionUser = c.get('user');
    if (sessionUser) {
        return next();
    }

    // Check for API key in Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const apiKey = authHeader.substring(7);
    if (!apiKey.startsWith('hemmelig_')) {
        return c.json({ error: 'Invalid API key format' }, 401);
    }

    try {
        const keyHash = createHash('sha256').update(apiKey).digest('hex');
        
        const apiKeyRecord = await prisma.apiKey.findUnique({
            where: { keyHash },
            include: { user: true },
        });

        if (!apiKeyRecord) {
            return c.json({ error: 'Invalid API key' }, 401);
        }

        // Check if key is expired
        if (apiKeyRecord.expiresAt && new Date() > apiKeyRecord.expiresAt) {
            return c.json({ error: 'API key has expired' }, 401);
        }

        // Update last used timestamp (fire and forget)
        prisma.apiKey.update({
            where: { id: apiKeyRecord.id },
            data: { lastUsedAt: new Date() },
        }).catch(() => {});

        // Set user from API key
        c.set('user', apiKeyRecord.user as typeof auth.$Infer.Session.user);
        c.set('session', null);
        
        return next();
    } catch (error) {
        console.error('API key auth error:', error);
        return c.json({ error: 'Authentication failed' }, 401);
    }
});