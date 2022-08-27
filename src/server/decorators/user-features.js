import fp from 'fastify-plugin';

export default fp(async (fastify) => {
    fastify.decorate('userFeatures', async (req, reply) => {
        const { ttl } = req.body;
        const file = await req.body.file;

        if ([2419200, 1209600].indexOf(Number(ttl?.value)) > -1) {
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
