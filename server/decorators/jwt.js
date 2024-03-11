import fp from 'fastify-plugin';

// https://github.com/fastify/fastify-jwt
export default fp(async (fastify) => {
    fastify.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.code(401).send({ error: 'Could not sign in' });
        }
    });
});
