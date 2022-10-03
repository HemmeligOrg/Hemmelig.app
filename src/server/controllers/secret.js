import prettyBytes from 'pretty-bytes';
import validator from 'validator';
import config from 'config';
import { hash, compare } from '../helpers/password.js';
import * as redis from '../services/redis.js';
import { validIdRegExp } from '../decorators/key-generation.js';

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

    const { password = '' } = request.body ? request.body : {};

    const result = {};

    // If it does not match the valid characters set for nanoid, return 403
    if (!validIdRegExp.test(id)) {
        return reply.code(403).send({ error: 'Not a valid secret ID' });
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
        Object.assign(result, { title: validator.unescape(data.title) });
    }

    if (data.preventBurn) {
        Object.assign(result, { preventBurn: JSON.parse(data.preventBurn) });
    }

    Object.assign(result, {
        secret: validator.unescape(data.secret),
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
            const { secretId, files } = req.secret;

            if (Buffer.byteLength(text) > config.get('api.maxTextSize')) {
                return reply.code(413).send({
                    error: `The secret size (${prettyBytes(
                        Buffer.byteLength(text)
                    )}) exceeded our limit of ${config.get('api.maxTextSize')}.`,
                });
            }

            if (title?.length > 255) {
                return reply.code(413).send({
                    error: `The title is longer than 255 characters which is not allowed.`,
                });
            }

            if (allowedIp && !ipCheck(allowedIp)) {
                return reply.code(409).send({ error: 'The IP address is not valid' });
            }

            const data = {
                id: secretId,
                title: title ? validator.escape(title) : '',
                maxViews: Number(maxViews) <= 999 ? Number(maxViews) : 1,
                secret: validator.escape(text),
                allowedIp: allowedIp ? validator.escape(allowedIp) : '',
            };

            if (password) {
                Object.assign(data, { password: await hash(validator.escape(password)) });
            }

            if (files) {
                Object.assign(data, { files });
            }

            if (preventBurn) {
                Object.assign(data, { preventBurn: true });
            }

            redis.createSecret(data, ttl);

            return reply.code(201).send({
                id: secretId,
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

        return { id, maxViews: data.maxViews };
    });
}

export default secret;
