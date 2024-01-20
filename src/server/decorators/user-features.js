import fp from 'fastify-plugin';
import adminSettings from '../adminSettings.js';
import config from 'config';

export default fp(async (fastify) => {
    fastify.decorate('userFeatures', async (req, reply) => {
        const { ttl } = req.body;
        const files = req.body.files;

        const verify = async (errorMessage) => {
            try {
                await req.jwtVerify();
            } catch (err) {
                return reply.send({
                    error: errorMessage,
                });
            }
        };

        if ([2419200, 1209600].indexOf(Number(ttl?.value)) > -1) {
            return await verify('You have to create an account to use the "Never expire" lifetime');
        }

        const hasFiles = files?.length > 0;

        if (hasFiles && adminSettings.get('disable_file_upload')) {
            return reply
                .code(403)
                .send({ error: 'Access denied. You are not allowed to upload files. 🥲' });
        }

        if (hasFiles && config.get('upload_restriction')) {
            return await verify('You have to create an account to use the "File upload"');
        }
    });
});
