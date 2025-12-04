import { Hono } from 'hono';
import { getEnabledSocialProviders } from './auth';
import accountRoute from './routes/account';
import analyticsRoute from './routes/analytics';
import apiKeysRoute from './routes/api-keys';
import filesRoute from './routes/files';
import instanceRoute from './routes/instance';
import { invitePublicRoute, inviteRoute } from './routes/invites';
import secretsRoute from './routes/secrets';
import setupRoute from './routes/setup';
import { userRoute } from './routes/user';

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
    .route('/api-keys', apiKeysRoute)
    //  .route('/', openapi)
    .get('/healthz', (c) => c.text('Health OK'))
    .get('/config/social-providers', (c) => {
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
