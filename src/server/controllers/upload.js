const { download, remove } = require('../services/do');

// https://stackabuse.com/uploading-files-to-aws-s3-with-node-js
async function uploadFiles(fastify) {
    fastify.post(
        '/download',
        {
            preValidation: [fastify.authenticate],
        },
        async (request, reply) => {
            const { key, encryptionKey, secretId, ext, mime } = request.body;

            const file = await download(key, encryptionKey);

            await remove(key);

            reply.header('Content-Disposition', `attachment; filename=${secretId}.${ext}`);
            reply.type(mime);
            reply.send(file);
        }
    );
}

module.exports = uploadFiles;
