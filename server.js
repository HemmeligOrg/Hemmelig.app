// Boot scripts
import('./server/bootstrap.js');

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import FastifyVite from '@fastify/vite';
import config from 'config';
import importFastify from 'fastify';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import template from 'y8';

import rateLimit from './server/plugins/rate-limit.js';

import adminDecorator from './server/decorators/admin.js';
import allowedIp from './server/decorators/allowed-ip.js';
import attachment from './server/decorators/attachment-upload.js';
import jwtDecorator from './server/decorators/jwt.js';
import userFeatures from './server/decorators/user-features.js';

import accountRoute from './server/controllers/account.js';
import adminSettingsRoute from './server/controllers/admin/settings.js';
import usersRoute from './server/controllers/admin/users.js';
import analyticsRoute from './server/controllers/analytics.js';
import authenticationRoute from './server/controllers/authentication.js';
import downloadRoute from './server/controllers/download.js';
import healthzRoute from './server/controllers/healthz.js';
import secretRoute from './server/controllers/secret.js';
import statsRoute from './server/controllers/stats.js';
import customHeaders from './server/plugins/custom-headers.js';
import blockBot from './server/prehandlers/block-bot.js';
import readCookieAllRoutesHandler from './server/prehandlers/cookie-all-routes.js';
import disableUserAccountCreationHandler from './server/prehandlers/disable-user-account-creation.js';
import disableUserHandler from './server/prehandlers/disable-users.js';
import readOnlyHandler from './server/prehandlers/read-only.js';
import restrictOrganizationEmailHandler from './server/prehandlers/restrict-organization-email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

const MAX_FILE_BYTES = 1024 * config.get('file.size') * 1000; // Example: 1024 * 2 * 1000 = 2 024 000 bytes

const staticPath = path.join(__dirname, !isDev ? 'client/build' : 'client');

const fastify = importFastify({
    logger: config.get('logger'),
    bodyLimit: MAX_FILE_BYTES,
});

await fastify.register(FastifyVite, {
    root: import.meta.url,
    dev: process.argv.includes('--dev'),
    spa: true,
});

fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'public'),
    prefix: '/static/',
});

fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'public', 'locales'),
    prefix: '/locales/',
    decorateReply: false,
});

if (!isDev) {
    const script = template(
        `
        try {
            window.__SECRET_CONFIG = {{config}}
        } catch (e) {
            window.__SECRET_CONFIG = '';
        }
    `,
        { config: `'${JSON.stringify(config.get('__client_config'))}';` }
    );

    const index = staticPath + '/index.html';

    const dom = new JSDOM(fs.readFileSync(index));
    dom.window.document.querySelector('#__secret_config').textContent = script;

    fs.writeFileSync(index, dom.serialize());
}

fastify.register(customHeaders);

fastify.register(rateLimit, {
    prefix: '/api/',
    max: config.get('rateLimit.max'),
    timeWindow: config.get('rateLimit.timeWindow'),
});

// https://github.com/fastify/fastify-helmet
fastify.register(helmet, {
    contentSecurityPolicy: {
        directives: {
            'font-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"],
            upgradeInsecureRequests: null,
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

// Define pre handlers
fastify.addHook('preHandler', readCookieAllRoutesHandler(fastify));
fastify.addHook('preHandler', disableUserHandler);
fastify.addHook('preHandler', disableUserAccountCreationHandler);
fastify.addHook('preHandler', readOnlyHandler);
fastify.addHook('preHandler', restrictOrganizationEmailHandler);
fastify.addHook('preHandler', blockBot);

function serveIndex(_, reply) {
    return reply.html();
}

fastify.get('/', serveIndex);
fastify.get('/secret/*', serveIndex);
fastify.get('/about', serveIndex);
fastify.get('/privacy', serveIndex);
fastify.get('/api-docs', serveIndex);
fastify.get('/signin', serveIndex);
fastify.get('/signup', serveIndex);
fastify.get('/signout', serveIndex);
fastify.get('/account*', serveIndex);
fastify.get('/terms', serveIndex);
fastify.get('/public*', serveIndex);
fastify.get('/stats', serveIndex);
fastify.get('/404', serveIndex);
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
fastify.register(analyticsRoute, { prefix: '/api/analytics' });
fastify.register(healthzRoute, { prefix: '/api/healthz' });
fastify.register(healthzRoute, { prefix: '/healthz' });

const startServer = async () => {
    try {
        await fastify.vite.ready();
        await fastify.listen({ port: config.get('port'), host: config.get('localHostname') });
    } catch (err) {
        fastify.log.error(err);
    }
};

startServer();
