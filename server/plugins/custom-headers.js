import fp from 'fastify-plugin';

export default fp((fastify, _, done) => {
    fastify.decorate('customHeaders', async (_, res) => {
        res.header('X-Github', 'https://github.com/HemmeligOrg/Hemmelig.app');
    });

    fastify.addHook('onRequest', fastify.customHeaders);
    done();
});
