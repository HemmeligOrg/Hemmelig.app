// do-connecting-ip
const fp = require('fastify-plugin');
const { createRateLimit } = require('../services/redis');

/*
        {
            preValidation: [fastify.rateLimit],
        },
*/

module.exports = fp(async (fastify) => {
    fastify.decorate('rateLimit', async (request, reply) => {
        const { headers } = request;

        const shouldRateLimit = await createRateLimit(headers.host);

        if (shouldRateLimit) {
            reply.code(429).send({ error: 'Too many requests, please try again later.' });
        }
    });
});
