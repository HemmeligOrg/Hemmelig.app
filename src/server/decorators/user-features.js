import fp from 'fastify-plugin';
import adminSettings from '../adminSettings.js';

export default fp(async (fastify) => {
    fastify.decorate('userFeatures', async (req, reply) => {
        const { ttl } = req.body;
        const files = req.body.files;

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

        if (files?.length && adminSettings.get('disable_file_upload')) {
            return reply
                .code(403)
                .send({ error: 'Access denied. You are not allowed to upload files. 🥲' });
        }

        if (files?.length) {
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
