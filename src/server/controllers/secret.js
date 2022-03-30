const prettyBytes = require('pretty-bytes');
const isIp = require('is-ip');
const validator = require('validator');
const config = require('config');
const { encrypt, decrypt } = require('../helpers/crypto');
const { hash, compare } = require('../helpers/password');

const redis = require('../services/redis');

const validIdRegExp = new RegExp('^[A-Za-z0-9_-]*$');

const ipCheck = (ip) => {
    if (ip === 'localhost') {
        return true;
    }

    return isIp(ip);
};

async function getSecretRoute(request, reply) {
    const { id } = request.params;

    const { password = '', encryptionKey = '' } = request.body ? request.body : {};

    const result = {};

    // If it does not match the valid characters set for nanoid, return 403
    if (!validIdRegExp.test(id) || !validIdRegExp.test(encryptionKey)) {
        return reply.code(403).send({ error: 'Not a valid secret id / encryption key' });
    }

    const data = await redis.getSecret(id);

    if (!data) {
        return reply.code(404).send({ error: 'Secret not found' });
    }

    if (data.password) {
        const isPasswordValid = await compare(validator.escape(password), data.password);
        if (!isPasswordValid) {
            return reply.code(401).send({ error: 'Wrong password!' });
        }
    }

    if (data.file) {
        Object.assign(result, { file: JSON.parse(data.file) });
    }

    Object.assign(result, { secret: decrypt(JSON.parse(data.secret), encryptionKey).toString() });

    redis.deleteSecret(id);

    return result;
}

async function secret(fastify) {
    const options = {
        preValidation: [fastify.basicAuth],
    };

    fastify.get(
        '/:id',
        {
            preValidation: [fastify.basicAuth, fastify.allowedIp],
        },
        getSecretRoute
    );
    fastify.post(
        '/:id',
        {
            preValidation: [fastify.basicAuth, fastify.allowedIp],
        },
        getSecretRoute
    );

    fastify.post(
        '/',
        {
            preValidation: [fastify.rateLimit, fastify.keyGeneration, fastify.attachment],
        },
        async (req, reply) => {
            const { text, ttl, password, allowedIp, preventBurn } = req.body;
            const { encryptionKey, secretId, file } = req.secret;

            if (Buffer.byteLength(text?.value) > config.get('api.maxTextSize')) {
                return reply.code(413).send({
                    error: `The secret size (${prettyBytes(
                        Buffer.byteLength(text?.value)
                    )}) exceeded our limit of ${config.get('api.maxTextSize')}.`,
                });
            }

            if (allowedIp?.value && !ipCheck(allowedIp.value)) {
                return reply.code(409).send({ error: 'The IP address is not valid' });
            }

            const data = {
                id: secretId,
                secret: JSON.stringify(encrypt(text?.value, encryptionKey)),
                allowedIp: allowedIp?.value,
            };

            if (password?.value) {
                Object.assign(data, { password: await hash(validator.escape(password.value)) });
            }

            if (file) {
                Object.assign(data, { file });
            }

            if (preventBurn?.value === 'true') {
                Object.assign(data, { preventBurn: true });
            }

            redis.createSecret(data, ttl.value);

            // Return the secret ID, and encryptet KEY to be used for the URL
            // By generating an encryption key per secret, we will never be able to open the
            // secret by using the master_secret_key
            // This is how it will work: SECRET_MASTER_KEY + RANDOM_ENCRYPTION_KEY to decrypt the message.
            // The RANDOM_KEY will be within the URL.
            // Example: https://hemmelig.app/secret/RANDOM_ENCRYPTION_KEY/SECRET_ID
            return reply.code(201).send({ id: secretId, key: encryptionKey });
        }
    );

    // This will burn the secret 🔥
    fastify.post('/:id/burn', options, async (request) => {
        const { id } = request.params;

        if (!validIdRegExp.test(id)) {
            return reply.code(403).send({ error: 'Not a valid secret id' });
        }

        const response = await redis.deleteSecret(id);

        if (!response) {
            return { error: 'Secret can not be burned before the expiration date' };
        } else {
            return { success: 'Secret is burned' };
        }
    });

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
