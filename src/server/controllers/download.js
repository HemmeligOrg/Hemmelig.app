import sanitize from 'sanitize-filename';
import fileAdapter from '../services/file-adapter.js';
import * as redis from '../services/redis.js';
import { validIdRegExp } from '../helpers/valid-id.js';

async function downloadFiles(fastify) {
    fastify.post('/', async (request, reply) => {
        const { key, secretId } = request.body;

        if (!validIdRegExp.test(secretId)) {
            return reply.code(403).send({ error: 'Not a valid secret id' });
        }

        const fileKey = sanitize(key);

        const file = await fileAdapter.download(fileKey);

        const secret = await redis.getSecret(secretId);

        if (secret?.preventBurn !== 'true' && Number(secret?.maxViews) === 1) {
            await client.del(`secret:${secretId}`);

            if (secret?.file) {
                const { key } = JSON.parse(secret?.file);

                await fileAdapter.remove(key);
            }
        }

        return reply.code(201).send({
            content: file,
        });
    });
}

export default downloadFiles;
