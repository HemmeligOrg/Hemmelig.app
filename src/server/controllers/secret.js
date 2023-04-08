import prettyBytes from 'pretty-bytes';
import validator from 'validator';
import config from 'config';
import prisma from '../services/prisma.js';
import { hash, compare } from '../helpers/password.js';

import { validIdRegExp } from '../decorators/key-generation.js';

const DEFAULT_EXPIRATION = 60 * 60 * 24 * 1000;

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

    // If it does not match the valid characters set for nanoid, return 403
    if (!validIdRegExp.test(id)) {
        return reply.code(403).send({ error: 'Not a valid secret ID' });
    }

    const data = await prisma.secret.findFirst({
        where: {
            id,
            expiresAt: { gte: new Date() },
        },
        include: { files: true },
    });

    if (!data) {
        return reply.code(404).send({ error: 'Secret not found' });
    }

    if (data.password) {
        const isPasswordValid = await compare(password, data.password);
        if (!isPasswordValid) {
            return reply.code(401).send({ error: 'Wrong password!' });
        }
    }

    if (data.maxViews > 1) {
        await prisma.secret.update({
            where: {
                id: data.id,
            },
            data: {
                maxViews: {
                    decrement: 1,
                },
            },
        });
    }

    if (!data.preventBurn && data.maxViews === 1) {
        await prisma.file.deleteMany({ where: { secretId: id } });
        await prisma.secret.delete({ where: { id } });
    }

    return {
        title: data.title,
        preventBurn: data.preventBurn,
        secret: data.data,
        files: data.files,
    };
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
            preValidation: [fastify.userFeatures, fastify.keyGeneration, fastify.attachment],
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

            await prisma.secret.create({
                data: {
                    id: secretId,
                    title,
                    maxViews: Number(maxViews) <= 999 ? Number(maxViews) : 1,
                    data: text,
                    allowed_ip: allowedIp,
                    password: password ? await hash(password) : undefined,
                    preventBurn,
                    files: {
                        create: files,
                    },
                    expiresAt: new Date(
                        Date.now() + (parseInt(ttl) ? parseInt(ttl) * 1000 : DEFAULT_EXPIRATION)
                    ),
                },
            });

            await prisma.statistic.upsert({
                where: {
                    id: 'secrets_created',
                },
                update: {
                    value: {
                        increment: 1,
                    },
                },
                create: { id: 'secrets_created' },
            });

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

        const response = await prisma.secret.delete({ where: { id } });

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

        const data = await prisma.secret.findFirst({
            where: { id },
        });

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
