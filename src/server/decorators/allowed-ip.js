import fp from 'fastify-plugin';
import ipRangeCheck from 'ip-range-check';
import prisma from '../services/prisma.js';
import getClientIp from '../helpers/client-ip.js';

export default fp(async (fastify) => {
    fastify.decorate('allowedIp', async (request, reply) => {
        const { headers } = request;
        const { id } = request.params;

        const data = await prisma.secret.findFirst({
            where: {
                id,
            },
        });

        const ip = getClientIp(headers);

        const allowedIp = data?.allowed_ip ?? null;

        if (ip && allowedIp && ip !== allowedIp && !ipRangeCheck(ip, allowedIp)) {
            reply.code(403).send({ error: 'Invalid IP address' });
        }
    });
});
