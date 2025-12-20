import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import 'dotenv/config';
import { Hono } from 'hono';
import api from './api/app';
import config from './api/config';

const port = config.get('server.port')!;

const app = new Hono();

// Mount the API first (before static files)
app.route('/api', api);

// Serve static files from the 'dist' directory
app.use('/*', serveStatic({ root: './dist' }));

// SPA fallback
app.get('*', serveStatic({ path: './dist/index.html' }));

// Graceful shutdown handler
function gracefulShutdown(signal: string, server: ReturnType<typeof serve>) {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    // Force exit after 10 seconds if graceful shutdown fails
    const forceExitTimeout = setTimeout(() => {
        console.error('Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
    }, 10000);

    server.close((err) => {
        clearTimeout(forceExitTimeout);
        if (err) {
            console.error('Error during shutdown:', err);
            process.exit(1);
        }
        console.log('Server closed successfully.');
        process.exit(0);
    });
}

// Start server in production
if (process.env.NODE_ENV === 'production') {
    const server = serve({
        fetch: app.fetch,
        port: port,
    });
    console.log(`Server is running on port ${port}`);

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM', server));
    process.on('SIGINT', () => gracefulShutdown('SIGINT', server));
}

export default app;
