import sanitize from 'sanitize-filename';
import fileAdapter from '../services/file-adapter.js';
import * as redis from '../services/redis.js';
import { validIdRegExp } from '../decorators/key-generation.js';

// https://stackabuse.com/uploading-files-to-aws-s3-with-node-js
async function downloadFiles(fastify) {
    fastify.post('/', async (request, reply) => {
        const { key, encryptionKey, secretId, ext, mime } = request.body;

        if (!validIdRegExp.test(secretId)) {
            return reply.code(403).send({ error: 'Not a valid secret id' });
        }

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

export default downloadFiles;
