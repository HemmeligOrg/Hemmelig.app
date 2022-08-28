import sanitize from 'sanitize-filename';
import fileAdapter from '../services/file-adapter.js';
import * as redis from '../services/redis.js';

// https://stackabuse.com/uploading-files-to-aws-s3-with-node-js
async function uploadFiles(fastify) {
    fastify.post('/download', async (request, reply) => {
        const { key, encryptionKey, secretId, ext, mime } = request.body;

        const fileKey = sanitize(key);

        const file = await fileAdapter.download(fileKey, encryptionKey);

        const secret = await redis.getSecret(secretId);

        if (secret?.preventBurn !== 'true' && Number(secret?.maxViews) === 1) {
            await client.del(`secret:${id}`);

            if (secret?.file) {
                const { key } = JSON.parse(secret?.file);

                await fileAdapter.remove(key);
            }
        }

        return reply
            .header('Content-Disposition', `attachment; filename=${secretId}.${ext}`)
            .type(mime)
            .code(200)
            .send(file);
    });
}

export default uploadFiles;
