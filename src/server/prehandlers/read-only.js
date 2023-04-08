import prisma from '../services/prisma.js';
import adminSettings from '../adminSettings.js';

// The auth routes
const regex = /^\/api\/authentication\/.*$/i;

export default async function readOnlyHandler(request, reply) {
    const { url } = request;

    if (regex.test(url)) {
        return;
    }

    const username = request?.user?.username;

    if (!username && adminSettings.get('read_only')) {
        return reply.code(403).send({ error: 'Access denied' });
    }

    const user = await prisma.user.findFirst({
        where: { username: request.user.username },
    });

    if (user.role !== 'admin' && adminSettings.get('read_only')) {
        return reply.code(403).send({ error: 'Access denied' });
    }
}
