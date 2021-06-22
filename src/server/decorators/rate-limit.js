// do-connecting-ip
const fp = require('fastify-plugin');
const { createRateLimit } = require('../services/redis');

/*
 *
 * Add this to the endpoints which has to be rate limited
 * {
 *   preValidation: [fastify.rateLimit],
 * }
 *
 */

module.exports = fp(async (fastify) => {
    fastify.decorate('rateLimit', async (request, reply) => {
        const { headers } = request;

        // Currently, hemmelig.app only have rate limiting available for non self-hosted version.
        // However, future wise it might be doable to add a setting for what header to check for an ip
        // For local testing, use this:  const ip = headers.host;
        const ip = 'do-connecting-ip' in headers ? headers['do-connecting-ip'] : '';

        if (ip) {
            const shouldRateLimit = await createRateLimit(headers.host);

            if (shouldRateLimit) {
                reply.code(429).send({ error: 'Too many requests, please try again later.' });
            }
        }
    });
});
