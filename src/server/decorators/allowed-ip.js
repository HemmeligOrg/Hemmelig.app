// do-connecting-ip
const fp = require('fastify-plugin');
const { getSecretKey } = require('../services/redis');
const getClientIp = require('../helpers/client-ip');

module.exports = fp(async (fastify) => {
    fastify.decorate('allowedIp', async (request, reply) => {
        const { headers } = request;
        const { id } = request.params;

        const allowedIp = await getSecretKey(id, 'allowed_ip');

        // Currently, hemmelig.app only have rate limiting available for non self-hosted version.
        // However, future wise it might be doable to add a setting for what header to check for an ip
        // For local testing, use this:  const ip = headers.host;
        const ip = getClientIp(headers);

        if (ip && allowedIp && ip !== allowedIp) {
            reply.code(403).send({ error: 'Invalid IP address' });
        }
    });
});
