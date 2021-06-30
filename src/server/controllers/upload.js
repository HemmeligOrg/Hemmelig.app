const { download, remove } = require('../services/do');

// https://stackabuse.com/uploading-files-to-aws-s3-with-node-js
async function uploadFiles(fastify) {
    fastify.post('/get_image', async (request, reply) => {
        const { key, encryptionKey, secretId, extension, mimetype } = request.body;

        const file = await download(key, encryptionKey);

        await remove(key);

        reply.header('Content-Disposition', `attachment; filename=${secretId}.${extension}`);
        reply.type(mimetype);
        reply.send(file);
    });
}

module.exports = uploadFiles;
