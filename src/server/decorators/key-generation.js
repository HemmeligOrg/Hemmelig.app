const fp = require('fastify-plugin');
const { nanoid } = require('nanoid');
const getRandomAdjective = require('../helpers/adjective');

module.exports = fp(async (fastify) => {
    fastify.decorate('keyGeneration', async (req) => {
        // Test id collision by using 21 characters https://zelark.github.io/nano-id-cc/
        const encryptionKey = nanoid();
        const secretId = getRandomAdjective() + '_' + nanoid();

        req.secret = {};

        Object.assign(req.secret, {
            encryptionKey,
            secretId,
        });
    });
});
