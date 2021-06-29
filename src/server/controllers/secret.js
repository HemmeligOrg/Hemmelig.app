const { nanoid } = require('nanoid');
const prettyBytes = require('pretty-bytes');
const isIp = require('is-ip');
const FileType = require('file-type');
const { encrypt, decrypt } = require('../helpers/crypto');
const { hash, compare } = require('../helpers/password');
const getRandomAdjective = require('../helpers/adjective');
const redis = require('../services/redis');

const { upload, download, remove } = require('../services/do');

const MAX_BYTES = 256 * 1000; // 256 kb - 256 000 bytes

const MAX_FILE_BYTES = 1024 * 16 * 1000; // 16mb - 16 024 000 bytes

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

    if (data.file_key) {
        Object.assign(result, {
            file_mimetype: data.file_mimetype,
            file_extension: data.file_extension,
            file_key: data.file_key,
        });
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
            preValidation: [fastify.rateLimit, fastify.basicAuth],
        },
        async (req, reply) => {
            const formData = await req.file();
            const { file, text, ttl, password, allowedIp } = formData.fields;

            if (Buffer.byteLength(text?.value) > MAX_BYTES) {
                return reply.code(413).send({
                    error: `The secret size (${prettyBytes(
                        Buffer.byteLength(text?.value)
                    )}) exceeded our limit of ${prettyBytes(MAX_BYTES)}.`,
                });
            }

            if (allowedIp.value && !ipCheck(allowedIp.value)) {
                return reply.code(409).send({ error: 'The IP address is not valid' });
            }

            // Test id collision by using 21 characters https://zelark.github.io/nano-id-cc/
            const id = getRandomAdjective() + '_' + nanoid();

            const key = nanoid();

            const data = {
                id,
                secret: JSON.stringify(encrypt(text?.value, key)),
                allowedIp: allowedIp.value,
            };

            if (file.filename && file.mimetype.startsWith('image/')) {
                const fileData = await file.toBuffer();
                const byteLength = Buffer.byteLength(fileData);

                if (byteLength > MAX_FILE_BYTES) {
                    return reply.code(413).send({
                        error: `The secret size (${prettyBytes(
                            byteLength
                        )}) exceeded our limit of ${prettyBytes(MAX_FILE_BYTES)}.`,
                    });
                }

                const imageData = await upload(key, fileData);

                const { ext, mime } = await FileType.fromBuffer(fileData);

                Object.assign(data, { file: { ext, mime, key: imageData.key } });
            }

            if (password.value) {
                Object.assign(data, { password: await hash(password.value) });
            }

            redis.createSecret(data, ttl.value);

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
