import prettyBytes from 'pretty-bytes';
import validator from 'validator';
import config from 'config';
import { encrypt, decrypt } from '../helpers/crypto.js';
import { hash, compare } from '../helpers/password.js';
import * as redis from '../services/redis.js';

const validIdRegExp = new RegExp('^[A-Za-z0-9_-]*$');

const ipCheck = (ip) => {
    if (ip === 'localhost') {
        return true;
    }

    if (!validator.isIP(ip) && !validator.isIPRange(ip)) {
        return false;
    }

    return validator.isIP(ip) || validator.isIPRange(ip);
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

    if (data.files) {
        Object.assign(result, { files: JSON.parse(data.files) });
    }

    if (data.title) {
        Object.assign(result, { title: data.title });
    }

    if (data.preventBurn) {
        Object.assign(result, { preventBurn: JSON.parse(data.preventBurn) });
    }

    Object.assign(result, {
        secret: decrypt(
            JSON.parse(data.secret),
            encryptionKey + password ? validator.escape(password) : ''
        ).toString(),
    });

    redis.deleteSecret(id);

    return result;
}

async function secret(fastify) {
    fastify.get(
        '/:id',
        {
            preValidation: [fastify.allowedIp],
        },
        getSecretRoute
    );
    fastify.post(
        '/:id',
        {
            preValidation: [fastify.allowedIp],
        },
        getSecretRoute
    );

    fastify.post(
        '/',
        {
            preValidation: [
                fastify.rateLimit,
                fastify.userFeatures,
                fastify.keyGeneration,
                fastify.attachment,
            ],
        },
        async (req, reply) => {
            const { text, title, ttl, password, allowedIp, preventBurn, maxViews } = req.body;
            const { encryptionKey, secretId, files } = req.secret;

            if (Buffer.byteLength(text?.value) > config.get('api.maxTextSize')) {
                return reply.code(413).send({
                    error: `The secret size (${prettyBytes(
                        Buffer.byteLength(text?.value)
                    )}) exceeded our limit of ${config.get('api.maxTextSize')}.`,
                });
            }

            if (title?.value.length > 255) {
                return reply.code(413).send({
                    error: `The title is longer than 255 characters which is not allowed.`,
                });
            }

            if (allowedIp?.value && !ipCheck(allowedIp.value)) {
                return reply.code(409).send({ error: 'The IP address is not valid' });
            }

            const data = {
                id: secretId,
                title: title?.value ? validator.escape(title?.value) : '',
                maxViews: Number(maxViews?.value) <= 999 ? Number(maxViews?.value) : 1,
                secret: JSON.stringify(
                    encrypt(
                        validator.escape(text?.value),
                        encryptionKey + password?.value ? validator.escape(password.value) : ''
                    )
                ),
                allowedIp: allowedIp?.value ? validator.escape(allowedIp?.value) : '',
            };

            if (password?.value) {
                Object.assign(data, { password: await hash(validator.escape(password.value)) });
            }

            if (files) {
                Object.assign(data, { files });
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
            return reply.code(201).send({
                id: secretId,
                key: encryptionKey,
                route: `/secret/${encryptionKey}/${secretId}`,
            });
        }
    );

    // This will burn the secret 🔥
    fastify.post('/:id/burn', async (request) => {
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

    fastify.get('/:id/exist', async (request, reply) => {
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

export default secret;
