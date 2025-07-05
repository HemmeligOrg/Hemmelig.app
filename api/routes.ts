import { Hono } from 'hono';
import secretsRoute from './routes/secrets';
import accountRoute from './routes/account';
import filesRoute from './routes/files';

// Create a new router
const routes = new Hono()
  .route('/secrets', secretsRoute)
  .route('/account', accountRoute)
  .route('/files', filesRoute)
  .get('/healthz', c => c.text('Health OK'));

export default routes;

