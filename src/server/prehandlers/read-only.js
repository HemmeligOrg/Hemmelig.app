import prisma from '../services/prisma.js';
import adminSettings from '../adminSettings.js';

// The auth routes
const regex = /^\/api\/authentication\/.*$/i;

export default function readOnlyHandler(fastify) {
    return async (request, reply) => {
        const { url } = request;

        if (regex.test(url)) {
            return;
        }

        const token = request.cookies['__HEMMELIG_TOKEN'] || null;

        if (!token && adminSettings.get('read_only')) {
            return reply.code(403).send({ error: 'Access denied' });
        }

        if (token) {
            const decoded = fastify.jwt.verify(token);

            const username = decoded?.username || null;

            const user = await prisma.user.findFirst({
                where: { username },
            });

            if (user.role !== 'admin' && adminSettings.get('read_only')) {
                return reply.code(403).send({ error: 'Access denied' });
            }
        }
    };
}
