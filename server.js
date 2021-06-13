const replace = require('replace-in-file');
const config = require('config');
const path = require('path');

const fastify = require('fastify')({
    logger: config.get('logger'),
});

// https://github.com/fastify/fastify-cors
fastify.register(require('fastify-cors'), { origin: '*' });

// Register our routes before the static content
fastify.register(require('./src/server/controllers/secret'), { prefix: '/api/secret' });

// Static frontend for the production build
if (process.env.NODE_ENV !== 'development') {
    const staticPath = path.join(__dirname, 'build');

    replace.sync({
        files: staticPath + '/index.html',
        from: /{{NODE_ENV}}/g,
        to: process.env.NODE_ENV,
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
        await fastify.listen(config.get('port'), config.get('hostname'));
    } catch (err) {
        fastify.log.error(err);
    }
};

startServer();
