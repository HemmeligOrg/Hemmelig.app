import fp from 'fastify-plugin';
import jwt from 'fastify-jwt';
import config from 'config';

// https://github.com/fastify/fastify-jwt
export default fp(async (fastify) => {
    fastify.register(jwt, {
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
