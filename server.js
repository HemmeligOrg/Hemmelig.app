const replace = require('replace-in-file');
const config = require('config');
const path = require('path');

const fastify = require('fastify')({
    logger: config.get('logger'),
});

// https://github.com/fastify/fastify-cors
fastify.register(require('fastify-cors'), { origin: '*' });

// Define decorators
fastify.register(require('./src/server/decorators/jwt'));
fastify.register(require('./src/server/decorators/basic-auth'));

// Register our routes before the static content
fastify.register(require('./src/server/controllers/authentication'), {
    prefix: '/api/authentication',
});

fastify.register(require('./src/server/controllers/account'), {
    prefix: '/api/account',
});

fastify.register(require('./src/server/controllers/secret'), { prefix: '/api/secret' });
fastify.register(require('./src/server/controllers/healthz'), { prefix: '/api/healthz' });
fastify.register(require('./src/server/controllers/healthz'), { prefix: '/healthz' });

// Static frontend for the production build
if (process.env.NODE_ENV !== 'development') {
    const staticPath = path.join(__dirname, 'build');

    // Filthy hack, but it works for now. Soon to implement config from the server.
    replace.sync({
        files: staticPath + '/**/*.html',
        from: [/{{NODE_ENV}}/g, /{{__SECRET_CONFIG}}/g],
        to: [process.env.NODE_ENV, JSON.stringify(config.get('__client_config'))],
    });

    fastify.register(require('fastify-static'), {
        root: staticPath,
        route: '/*',
    });

    function serveIndex(_, reply) {
        return reply.sendFile('index.html');
    }

    fastify.get('/secret/*', serveIndex);
    fastify.get('/about', serveIndex);
    fastify.get('/privacy', serveIndex);
    fastify.get('/api', serveIndex);
}

const startServer = async () => {
    try {
        await fastify.listen(config.get('port'), config.get('localHostname'));
    } catch (err) {
        fastify.log.error(err);
    }
};

startServer();
