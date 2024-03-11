import fp from 'fastify-plugin';
import prisma from '../services/prisma.js';

// This decorator can be attached to endpoints to validate
// if the user has admin rights or not
export default fp(async (fastify) => {
    fastify.decorate('admin', async (request, reply) => {
        const username = request?.user?.username ?? null;

        if (username) {
            const user = await prisma.user.findFirst({
                where: { username: request.user.username },
            });

            if (user.role !== 'admin') {
                return reply.code(403).send({ error: 'Access denied' });
            }
        }
    });
});
