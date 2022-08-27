import sanitize from 'sanitize-filename';
import fileAdapter from '../services/file-adapter.js';
import * as redis from '../services/redis.js';

// https://stackabuse.com/uploading-files-to-aws-s3-with-node-js
async function uploadFiles(fastify) {
    fastify.post('/download', async (request, reply) => {
        const { key, encryptionKey, secretId, ext, mime } = request.body;

        const preventBurn = (await redis.getSecretKey(secretId, 'preventBurn')) === 'true';

        const fileKey = sanitize(key);

        const file = await fileAdapter.download(fileKey, encryptionKey);

        if (!preventBurn) {
            await fileAdapter.remove(fileKey);
        }

        return reply
            .header('Content-Disposition', `attachment; filename=${secretId}.${ext}`)
            .type(mime)
            .code(200)
            .send(file);
    });
}

export default uploadFiles;
