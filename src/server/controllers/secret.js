const { nanoid } = require('nanoid');
const prettyBytes = require('pretty-bytes');
const { encrypt, decrypt } = require('../helpers/crypto');
const { hash, compare } = require('../helpers/password');
const getRandomAdjective = require('../helpers/adjective');
const redis = require('../services/redis');

const MAX_BYTES = 256 * 1000; // 256 kb - 256 000 bytes

const validIdRegExp = new RegExp('^[A-Za-z0-9_-]*$');

async function getSecretRoute(request, reply) {
    const { id } = request.params;

    const { password = '', encryptionKey = '' } = request.body ? request.body : {};

    // If it does not match the valid characters set for nanoid, return 403
    if (!validIdRegExp.test(id)) {
        return reply.code(403).send({ error: 'Not a valid secret id' });
    }

    const data = await redis.getSecret(id);

    if (!data) {
        return reply.code(404).send({ error: 'Secret not found' });
    }

    if (data.password) {
        const isPasswordValid = await compare(password, data.password);
        if (!isPasswordValid) {
            return reply.code(401).send({ error: 'Wrong password!' });
        }
    }

    const secret = decrypt(JSON.parse(data.secret), encryptionKey);

    redis.deleteSecret(id);

    return { secret };
}

async function secret(fastify) {
    const options = {
        preValidation: [fastify.basicAuth],
    };

    fastify.get('/:id', options, getSecretRoute);
    fastify.post('/:id', options, getSecretRoute);

    fastify.post(
        '/',
        {
            preValidation: [fastify.rateLimit, fastify.basicAuth],
        },
        async (request, reply) => {
            const { text, ttl, password } = request.body;

            if (Buffer.byteLength(text) > MAX_BYTES) {
                return reply.code(413).send({
                    error: `The secret size (${prettyBytes(
                        Buffer.byteLength(text)
                    )}) exceeded our limit of ${prettyBytes(MAX_BYTES)}.`,
                });
            }

            // Test id collision by using 21 characters https://zelark.github.io/nano-id-cc/
            const id = getRandomAdjective() + '_' + nanoid();

            const key = nanoid();

            const data = {
                id,
                secret: JSON.stringify(encrypt(text, key)),
            };

            if (password) {
                Object.assign(data, { password: await hash(password) });
            }

            redis.createSecret(data, ttl);

            // Return the secret ID, and encryptet KEY to be used for the URL
            // By generating an encryption key per secret, we will never be able to open the
            // secret by using the master_secret_key
            // This is how it will work: SECRET_MASTER_KEY + RANDOM_KEY to decrypt the message.
            // The RANDOM_KEY will be within the URL.
            // Example: https://hemmelig.app/secret/RANDOM_KEY/SECRET_ID
            return reply.code(201).send({ id, key });
        }
    );

    // This will burn the secret 🔥
    fastify.get('/:id/burn', options, async (request) => {
        const { id } = request.params;

        if (!validIdRegExp.test(id)) {
            return reply.code(403).send({ error: 'Not a valid secret id' });
        }

        redis.deleteSecret(id);

        return { success: 'Secret burned' };
    });

    // This will burn the secret 🔥
    fastify.get('/:id/exist', options, async (request, reply) => {
        const { id } = request.params;

        if (!validIdRegExp.test(id)) {
            return reply.code(403).send({ error: 'Not a valid secret id' });
        }

        const data = await redis.getSecret(id);

        if (!data) {
            return reply.code(404).send({ error: 'Secret not found' });
        }

        if (data.password) {
            return reply.code(401).send({ error: 'Password required' });
        }

        return { id };
    });
}

module.exports = secret;
