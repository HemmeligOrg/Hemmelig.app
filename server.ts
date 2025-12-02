
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import api from './api/app';
import config from './api/config';

const port = config.get('server.port')!;
console.log(`Server is running on port ${port}`);

const app = new Hono();

// Mount the API first (before static files)
app.route('/api', api);

// Serve static files from the 'dist' directory
app.use('/*', serveStatic({ root: './dist' }));

// SPA fallback
app.get('*', serveStatic({ path: './dist/index.html' }));

export default app;
