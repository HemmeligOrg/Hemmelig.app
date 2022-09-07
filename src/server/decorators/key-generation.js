import fp from 'fastify-plugin';
import { nanoid } from 'nanoid';
import * as redis from '../services/redis.js';
import getRandomAdjective from '../helpers/adjective.js';

export const validIdRegExp = new RegExp('^[A-Za-z0-9_-]*$');

function createKeys() {
    return {
        // Test id collision by using 21 characters https://zelark.github.io/nano-id-cc/
        encryptionKey: nanoid(),
        secretId: getRandomAdjective() + '_' + nanoid(),
    };
}

async function getKeys() {
    let keys = createKeys();

    let retries = 5;

    while ((await redis.keyExists(`secret:${keys.secretId}`)) && retries !== 0) {
        keys = createKeys();
        retries--;
    }

    if (retries === 0) {
        throw 'Too many attempts. Please try again.';
    }

    return keys;
}

export default fp(async (fastify) => {
    fastify.decorate('keyGeneration', async (req, reply) => {
        req.secret = {};

        try {
            const keys = await getKeys();

            Object.assign(req.secret, keys);
        } catch (error) {
            console.error(error);

            return reply.code(403).send({
                error: 'Something happened while creating the secret. Please try again.',
            });
        }
    });
});
