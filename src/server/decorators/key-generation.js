const fp = require('fastify-plugin');
const { nanoid } = require('nanoid');
const getRandomAdjective = require('../helpers/adjective');

const validIdRegExp = new RegExp('^[A-Za-z0-9_-]*$');

module.exports = fp(async (fastify) => {
    fastify.decorate('keyGeneration', async (req) => {
        // Test id collision by using 21 characters https://zelark.github.io/nano-id-cc/
        const encryptionKey = nanoid();
        const secretId = getRandomAdjective() + '_' + nanoid();

        // If it does not match the valid characters set for nanoid, return 403
        if (!validIdRegExp.test(secretId) || !validIdRegExp.test(encryptionKey)) {
            return reply.code(403).send({ error: 'Not a valid secret id / encryption key' });
        }

        req.secret = {};

        Object.assign(req.secret, {
            encryptionKey,
            secretId,
        });
    });
});
