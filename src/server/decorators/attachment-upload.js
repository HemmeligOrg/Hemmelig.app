import fp from 'fastify-plugin';
import fileAdapter from '../services/file-adapter.js';

export default fp(async (fastify) => {
    fastify.decorate('attachment', async (req, reply) => {
        req.secret = {
            files: [],
        };

        const { files } = await req.body;

        if (files?.length) {
            for (const file of files) {
                try {
                    const imageData = await fileAdapter.upload(file.content);

                    req.secret.files.push({
                        type: file.type,
                        ext: file.ext,
                        key: imageData.key,
                    });
                } catch (error) {
                    console.error(error.message);

                    return reply.code(403).send({
                        type: 'files',
                        error: `Something went wrong uploading your files. Please try again.`,
                    });
                }
            }
        }
    });
});
