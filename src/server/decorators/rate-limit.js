// do-connecting-ip
import fp from 'fastify-plugin';
import { createRateLimit } from '../services/redis.js';
import getClientIp from '../helpers/client-ip.js';

/*
 *
 * Add this to the endpoints which has to be rate limited
 * {
 *   preValidation: [fastify.rateLimit],
 * }
 *
 */

export default fp(async (fastify) => {
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
