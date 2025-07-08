import { Hono } from 'hono';
import secretsRoute from './routes/secrets';
import accountRoute from './routes/account';
import filesRoute from './routes/files';
import { userRoute } from './routes/user';
import instanceRoute from './routes/instance';
import analyticsRoute from './routes/analytics';

// Create a new router
const routes = new Hono()
  .route('/secrets', secretsRoute)
  .route('/account', accountRoute)
  .route('/files', filesRoute)
  .route('/user', userRoute)
  .route('/instance', instanceRoute)
  .route('/analytics', analyticsRoute)
  .get('/healthz', c => c.text('Health OK'));

export default routes;

