const fp = require('fastify-plugin');

module.exports = fp(async (fastify) => {
    fastify.decorate('userFeatures', async (req, reply) => {
        const { ttl } = req.body;
        const file = await req.body.file;

        if (Number(ttl?.value) === 0) {
            // TODO: do not write dublicates
            try {
                await req.jwtVerify();
            } catch (err) {
                return reply.send({
                    error: 'You have to create an account to use the "Never expire" lifetime',
                });
            }
        }

        if (file?.filename) {
            // TODO: do not write dublicates
            try {
                await req.jwtVerify();
            } catch (err) {
                return reply.send({
                    error: 'You have to create an account to use the "File upload"',
                });
            }
        }
    });
});
