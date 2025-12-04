import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { etag, RETAINED_304_HEADERS } from 'hono/etag';
import { logger } from 'hono/logger';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { timeout } from 'hono/timeout';
import { trimTrailingSlash } from 'hono/trailing-slash';

import { auth } from './auth';
import config from './config';
import startJobs from './jobs';
import prisma from './lib/db';
import ratelimit from './middlewares/ratelimit';
import routes from './routes';

// Initialize Hono app
const app = new Hono<{
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
        session: typeof auth.$Infer.Session.session | null;
    };
}>();

// Start the background jobs
startJobs();

// Add the middlewares
// More middlewares can be found here:
// https://hono.dev/docs/middleware/builtin/basic-auth
app.use(secureHeaders());
app.use(logger());
app.use(trimTrailingSlash());
app.use(`/*`, requestId());
app.use(`/*`, timeout(15 * 1000)); // 15 seconds timeout to the API calls
app.use(ratelimit);

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag
app.use(
    `/*`,
    etag({
        retainedHeaders: ['x-message', ...RETAINED_304_HEADERS],
    })
);

// Configure CORS with trusted origins
const trustedOrigins = config.get<string[]>('trustedOrigins', []);
app.use(
    `/*`,
    cors({
        origin: trustedOrigins,
        credentials: true,
    })
);

// Configure CSRF protection (exclude auth routes for OAuth callbacks)
app.use('/*', async (c, next) => {
    // Skip CSRF for auth routes (OAuth callbacks come from external origins)
    if (c.req.path.startsWith('/auth/')) {
        return next();
    }
    return csrf({
        origin: trustedOrigins,
    })(c, next);
});

// Custom middlewares
app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
        c.set('user', null);
        c.set('session', null);
        return next();
    }

    c.set('user', session.user);
    c.set('session', session.session);
    return next();
});

// Add the routes
app.on(['POST', 'GET'], `/auth/*`, (c) => {
    return auth.handler(c.req.raw);
});

// Add the application routes
app.route('/', routes);

// https://hono.dev/docs/guides/rpc#rpc
export type AppType = typeof routes;

export default app;

// Handle graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    console.info('Disconnected from database');
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
    });
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
    console.error('Unhandled Rejection', { reason });
    process.exit(1);
});
