
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import api from './api/app';
import config from './api/config';

const port = config.get('server.port')!;
console.log(`Server is running on port ${port}`);

const app = new Hono();

// Serve static files from the 'dist' directory
app.use('/*', serveStatic({ root: './dist' }));

// SPA fallback
app.get('*', serveStatic({ path: './dist/index.html' }));

// Mount the API
app.route('/api', api);
/*
serve({
    fetch: app.fetch,
    port,
});
*/

export default app;
