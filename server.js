// Boot scripts
import('./src/server/bootstrap.js');

import config from 'config';
import path from 'path';
import { fileURLToPath } from 'url';
import importFastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import fstatic from '@fastify/static';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';

import adminDecorator from './src/server/decorators/admin.js';
import jwtDecorator from './src/server/decorators/jwt.js';
import userFeatures from './src/server/decorators/user-features.js';
import allowedIp from './src/server/decorators/allowed-ip.js';
import attachment from './src/server/decorators/attachment-upload.js';
import keyGeneration from './src/server/decorators/key-generation.js';

import readCookieAllRoutesHandler from './src/server/prehandlers/cookie-all-routes.js';
import readOnlyHandler from './src/server/prehandlers/read-only.js';

import usersRoute from './src/server/controllers/admin/users.js';
import adminSettingsRoute from './src/server/controllers/admin/settings.js';
import authenticationRoute from './src/server/controllers/authentication.js';
import accountRoute from './src/server/controllers/account.js';
import downloadRoute from './src/server/controllers/download.js';
import secretRoute from './src/server/controllers/secret.js';
import statsRoute from './src/server/controllers/stats.js';
import healthzRoute from './src/server/controllers/healthz.js';

import disableUserHandler from './src/server/prehandlers/disable-users.js';

const isDev = process.env.NODE_ENV === 'development';

const MAX_FILE_BYTES = 1024 * config.get('file.size') * 1000; // Example: 1024 * 2 * 1000 = 2 024 000 bytes

const fastify = importFastify({
    logger: config.get('logger'),
    bodyLimit: MAX_FILE_BYTES,
});

// https://github.com/fastify/fastify-rate-limit
fastify.register(rateLimit, {
    max: 10000,
    timeWindow: '1 minute',
});

// https://github.com/fastify/fastify-helmet
fastify.register(helmet, {
    contentSecurityPolicy: {
        directives: {
            'font-src': ["'self'", 'https://rsms.me/'],
            'script-src': ["'self'", "'unsafe-inline'"],
        },
    },
    crossOriginEmbedderPolicy: false,
});

// https://github.com/fastify/fastify-cors
fastify.register(cors, { origin: config.get('cors') });

// https://github.com/fastify/fastify-jwt#cookie
fastify.register(jwt, {
    secret: config.get('jwt.secret'),
    cookie: {
        cookieName: config.get('jwt.cookie'),
        signed: false,
    },
});
fastify.register(cookie);

// Define decorators
fastify.register(adminDecorator);
fastify.register(jwtDecorator);
fastify.register(userFeatures);
fastify.register(allowedIp);
fastify.register(attachment);
fastify.register(keyGeneration);

// Define pre handlers
fastify.addHook('preHandler', readCookieAllRoutesHandler(fastify));
fastify.addHook('preHandler', disableUserHandler);
fastify.addHook('preHandler', readOnlyHandler);

// Register our routes before the static content

fastify.register(authenticationRoute, {
    prefix: '/api/authentication',
});

fastify.register(accountRoute, {
    prefix: '/api/account',
});

fastify.register(usersRoute, {
    prefix: '/api/admin/users',
});

fastify.register(adminSettingsRoute, {
    prefix: '/api/admin/settings',
});

fastify.register(downloadRoute, { prefix: '/api/download' });
fastify.register(secretRoute, { prefix: '/api/secret' });
fastify.register(statsRoute, { prefix: '/api/stats' });
fastify.register(healthzRoute, { prefix: '/api/healthz' });
fastify.register(healthzRoute, { prefix: '/healthz' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const staticPath = path.join(__dirname, !isDev ? 'build' : '');

// Static frontend for the production build
if (!isDev) {
    fastify.register(fstatic, {
        root: staticPath,
        route: '/*',
    });

    function serveIndex(_, reply) {
        return reply.sendFile('index.html');
    }

    fastify.get('/secret/*', serveIndex);
    fastify.get('/about', serveIndex);
    fastify.get('/privacy', serveIndex);
    fastify.get('/api-docs', serveIndex);
    fastify.get('/signin', serveIndex);
    fastify.get('/signup', serveIndex);
    fastify.get('/account', serveIndex);
    fastify.get('/terms', serveIndex);
}

const startServer = async () => {
    try {
        await fastify.listen({ port: config.get('port'), host: config.get('localHostname') });
    } catch (err) {
        fastify.log.error(err);
    }
};

startServer();
