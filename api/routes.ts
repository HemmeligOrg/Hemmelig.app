import { Hono } from 'hono';
import secretsRoute from './routes/secrets';
import accountRoute from './routes/account';
import filesRoute from './routes/files';
import { userRoute } from './routes/user';
import instanceRoute from './routes/instance';
import analyticsRoute from './routes/analytics';
import { inviteRoute, invitePublicRoute } from './routes/invites';
import setupRoute from './routes/setup';
import openapi from './openapi';
import { getEnabledSocialProviders } from './auth';

// Create a new router
const routes = new Hono()
  .route('/secrets', secretsRoute)
  .route('/account', accountRoute)
  .route('/files', filesRoute)
  .route('/user', userRoute)
  .route('/instance', instanceRoute)
  .route('/analytics', analyticsRoute)
  .route('/invites/public', invitePublicRoute)
  .route('/invites', inviteRoute)
  .route('/setup', setupRoute)
  .route('/', openapi)
  .get('/healthz', c => c.text('Health OK'))
  .get('/config/social-providers', c => {
    const providers = getEnabledSocialProviders();
    const baseUrl = process.env.HEMMELIG_BASE_URL || c.req.header('origin') || '';
    const callbackBaseUrl = baseUrl ? `${baseUrl}/api/auth/callback` : '';
    
    return c.json({ 
      providers,
      callbackBaseUrl,
    });
  });

export default routes;

export type AppType = typeof routes;

