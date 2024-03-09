import sanitize from 'sanitize-filename';
import fileAdapter from '../services/file-adapter.js';
import prisma from '../services/prisma.js';

import { isValidSecretId } from '../helpers/regexp.js';

async function downloadFiles(fastify) {
    fastify.post(
        '/',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['key', 'secretId'],
                    properties: {
                        key: { type: 'string' },
                        secretId: { type: 'string' },
                    },
                },
            },
        },
        async (request, reply) => {
            const { key, secretId } = request.body;

            if (!isValidSecretId.test(secretId)) {
                return reply.code(400).send({ error: 'Not a valid secret id' });
            }

            const fileKey = sanitize(key);

            const file = await fileAdapter.download(fileKey);

            const secret = await prisma.secret.findFirst({ where: { id: secretId } });

            // When the secret is null, we delete the file.
            // The deletion will happen in the secrets controller
            if (!secret) {
                await fileAdapter.remove(fileKey);
            }

            return reply.code(201).send({
                content: file,
            });
        }
    );
}

export default downloadFiles;
