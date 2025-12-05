import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
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

// Start server in production
if (process.env.NODE_ENV === 'production') {
    serve({
        fetch: app.fetch,
        port: port,
    });
    console.log(`Server is running on port ${port}`);
}

export default app;
