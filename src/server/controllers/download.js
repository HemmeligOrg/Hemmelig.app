import sanitize from 'sanitize-filename';
import prisma from '../services/prisma.js';
import fileAdapter from '../services/file-adapter.js';

import { isValidSecretId } from '../helpers/regexp.js';

async function downloadFiles(fastify) {
    fastify.post('/', async (request, reply) => {
        const { key, secretId } = request.body;

        if (!isValidSecretId.test(secretId)) {
            return reply.code(403).send({ error: 'Not a valid secret id' });
        }

        const fileKey = sanitize(key);

        const file = await fileAdapter.download(fileKey);

        const secret = await prisma.secret.findFirst({ where: { id: secretId } });

        if (secret?.preventBurn !== 'true' && Number(secret?.maxViews) === 1) {
            await prisma.secret.delete({ where: { id: secretId } });

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
