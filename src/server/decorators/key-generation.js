import fp from 'fastify-plugin';
import { nanoid } from 'nanoid';
import * as redis from '../services/redis.js';
import getRandomAdjective from '../helpers/adjective.js';

export const validIdRegExp = new RegExp('^[A-Za-z0-9_-]*$');

function createSecretId() {
    // Test id collision by using 32 characters https://zelark.github.io/nano-id-cc/
    return getRandomAdjective() + '_' + nanoid(32);
}

async function getSecretId() {
    let secretId = createSecretId();

    let retries = 5;

    while ((await redis.keyExists(`secret:${secretId}`)) && retries !== 0) {
        secretId = createSecretId();
        retries--;
    }

    if (retries === 0) {
        throw new Error('Too many attempts. Please try again.');
    }

    return secretId;
}

export default fp(async (fastify) => {
    fastify.decorate('keyGeneration', async (req, reply) => {
        req.secret = {};

        try {
            const secretId = await getSecretId();

            req.secret.secretId = secretId;
        } catch (error) {
            console.error(error);

            return reply.code(403).send({
                error: 'Something happened while creating the secret. Please try again.',
            });
        }
    });
});
