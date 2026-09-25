import { createHash } from 'crypto';
import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { auth } from '../auth';
import prisma from '../lib/db';

/** How the current request authenticated. */
export type AuthMethod = 'session' | 'apiKey';

type Env = {
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
        session: typeof auth.$Infer.Session.session | null;
        authMethod: AuthMethod | null;
    };
};

type ApiKeyAuthResult = { user: typeof auth.$Infer.Session.user } | { error: string; status: 401 };
type AuthContext = Context<Env>;

async function authenticateApiKeyHeader(authHeader: string | undefined): Promise<ApiKeyAuthResult> {
    if (!authHeader?.startsWith('Bearer ')) {
        return { error: 'Unauthorized', status: 401 };
    }

    const apiKey = authHeader.substring(7);
    if (!apiKey.startsWith('hemmelig_')) {
        return { error: 'Invalid API key format', status: 401 };
    }

    try {
        const keyHash = createHash('sha256').update(apiKey).digest('hex');

        const apiKeyRecord = await prisma.apiKey.findUnique({
            where: { keyHash },
            include: { user: true },
        });

        if (!apiKeyRecord) {
            return { error: 'Invalid API key', status: 401 };
        }

        if (apiKeyRecord.expiresAt && new Date() > apiKeyRecord.expiresAt) {
            return { error: 'API key has expired', status: 401 };
        }

        const user = apiKeyRecord.user;
        const banActive =
            user.banned === true && (!user.banExpires || new Date() < user.banExpires);

        if (banActive) {
            return { error: 'Account is banned', status: 401 };
        }

        prisma.apiKey
            .update({
                where: { id: apiKeyRecord.id },
                data: { lastUsedAt: new Date() },
            })
            .catch(() => {});

        return { user: apiKeyRecord.user as typeof auth.$Infer.Session.user };
    } catch (error) {
        console.error('API key auth error:', error);
        return { error: 'Authentication failed', status: 401 };
    }
}

async function setApiKeyUserFromHeader(c: AuthContext, authHeader: string | undefined) {
    const result = await authenticateApiKeyHeader(authHeader);
    if ('error' in result) {
        return c.json({ error: result.error }, result.status);
    }

    c.set('user', result.user);
    c.set('session', null);
    c.set('authMethod', 'apiKey');

    return null;
}

/**
 * Requires an authenticated user. A session cookie or an
 * `Authorization: Bearer <api key>` header is accepted. An API key acts with
 * the role of its owner.
 */
export const authMiddleware = createMiddleware<Env>(async (c, next) => {
    if (c.get('user')) {
        c.set('authMethod', 'session');
        return next();
    }

    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const authResponse = await setApiKeyUserFromHeader(c, authHeader);
    if (authResponse) {
        return authResponse;
    }

    return next();
});

/**
 * Rejects requests that authenticate with an API key. Use it after
 * `authMiddleware` on routes that change credentials, so a leaked key cannot
 * take over the account.
 */
export const sessionOnly = createMiddleware<Env>(async (c, next) => {
    if (c.get('authMethod') !== 'session') {
        return c.json({ error: 'This action requires a signed-in session.' }, 403);
    }

    return next();
});

export const checkAdmin = createMiddleware<Env>(async (c, next) => {
    const sessionUser = c.get('user');
    if (!sessionUser) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { role: true },
    });

    if (!user || user.role !== 'admin') {
        return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
});

// Kept for existing imports. `authMiddleware` accepts sessions and API keys.
export const apiKeyOrAuthMiddleware = authMiddleware;

// Middleware that accepts session auth OR API key auth, but also allows anonymous access
export const optionalApiKeyOrAuthMiddleware = createMiddleware<Env>(async (c, next) => {
    const sessionUser = c.get('user');
    if (sessionUser) {
        c.set('authMethod', 'session');
        return next();
    }

    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
        return next();
    }

    const authResponse = await setApiKeyUserFromHeader(c, authHeader);
    if (authResponse) {
        return authResponse;
    }

    return next();
});
