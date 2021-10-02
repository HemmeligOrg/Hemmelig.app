// do-connecting-ip
const fp = require('fastify-plugin');
const { createRateLimit } = require('../services/redis');
const getClientIp = require('../helpers/client-ip');

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
        const ip = getClientIp(headers);

        if (ip) {
            const shouldRateLimit = await createRateLimit(ip);

            if (shouldRateLimit) {
                reply.code(429).send({ error: 'Too many requests, please try again later.' });
            }
        }
    });
});
