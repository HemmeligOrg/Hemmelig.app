import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { etag, RETAINED_304_HEADERS } from 'hono/etag';
import { timeout } from 'hono/timeout';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { serveStatic } from "@hono/node-server/serve-static";
//import { csrf } from 'hono/csrf';
//import { cors } from 'hono/cors';

import { auth } from "./auth";
import prisma from './api/lib/db';
import routes from './api/routes';

// Initialize Hono app
const app = new Hono<{
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
        session: typeof auth.$Infer.Session.session | null
    }
}>();
const PORT = Number(process.env.PORT) || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Add the middlewares
// More middlewares can be found here:
// https://hono.dev/docs/middleware/builtin/basic-auth
app.use(secureHeaders());
app.use(logger());
app.use(trimTrailingSlash());
app.use(`/${API_VERSION}/*`, requestId());
app.use(`/${API_VERSION}/*`, timeout(15 * 1000)); // 15 seconds timeout to the API calls

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag
app.use(
    `/${API_VERSION}/*`,
    etag({
        retainedHeaders: ['x-message', ...RETAINED_304_HEADERS],
    }),
);

// ------ Configure these youself ------
// Configure CORS: https://hono.dev/docs/middleware/builtin/cors
//app.use(`/${API_VERSION}/*`, cors())

// Configure CSRF: https://hono.dev/docs/middleware/builtin/csrf
//app.use(csrf())
// -------------------------------------

// Custom middlewares
app.use("*", async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
        c.set("user", null);
        c.set("session", null);
        return next();
    }

    c.set("user", session.user);
    c.set("session", session.session);
    return next();
});

// Add the routes
app.on(["POST", "GET"], `/${API_VERSION}/api/auth/*`, (c) => {
    return auth.handler(c.req.raw);
});


app.route(`/${API_VERSION}`, routes);

// Serve static assets from the 'dist' directory
app.use("/*", serveStatic({ root: "./dist" }));

// SPA fallback: serve index.html for any request that doesn't have a file extension
app.get("*", serveStatic({ path: "./dist/index.html" }));

// https://hono.dev/docs/guides/rpc#rpc
export type AppType = typeof routes;

export default {
    port: PORT,
    fetch: app.fetch,
};

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
