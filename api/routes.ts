import { Hono } from 'hono';
import secretsRoute from './routes/secrets';
import accountRoute from './routes/account';

// Create a new router
const routes = new Hono()
  .route('/secrets', secretsRoute)
  .route('/account', accountRoute)
  .get('/healthz', c => c.text('Health OK'));

export default routes;
