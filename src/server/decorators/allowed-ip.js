import fp from 'fastify-plugin';
import ipRangeCheck from 'ip-range-check';
import { PrismaClient } from '@prisma/client';
import getClientIp from '../helpers/client-ip.js';

const prisma = new PrismaClient();

export default fp(async (fastify) => {
    fastify.decorate('allowedIp', async (request, reply) => {
        const { headers } = request;
        const { id } = request.params;

        const data = await prisma.secret.findFirst({
            where: {
                id,
            },
        });

        // Currently, hemmelig.app only have rate limiting available for non self-hosted version.
        // However, future wise it might be doable to add a setting for what header to check for an ip
        // For local testing, use this:  const ip = headers.host;
        const ip = getClientIp(headers);

        const allowedIp = data['allowed_ip'];

        if (ip && allowedIp && ip !== allowedIp && !ipRangeCheck(ip, allowedIp)) {
            reply.code(403).send({ error: 'Invalid IP address' });
        }
    });
});
