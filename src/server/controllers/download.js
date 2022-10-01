import sanitize from 'sanitize-filename';
import fileAdapter from '../services/file-adapter.js';
import * as redis from '../services/redis.js';
import { validIdRegExp } from '../decorators/key-generation.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function downloadFiles(fastify) {
    fastify.post('/', async (request, reply) => {
        const { key, secretId } = request.body;

        if (!validIdRegExp.test(secretId)) {
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
