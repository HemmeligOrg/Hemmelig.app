const fp = require('fastify-plugin');
const config = require('config');

// https://github.com/fastify/fastify-jwt
module.exports = fp(async (fastify, opts) => {
    fastify.register(require('fastify-jwt'), {
        secret: config.get('jwt.secret'),
    });

    fastify.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });
});
