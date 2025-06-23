import { Hono } from 'hono';
import secretsRoute from './routes/secrets';

// Create a new router
const routes = new Hono()
  .route('/secrets', secretsRoute)
  .get('/healthz', c => c.text('Health OK'));

export default routes;
