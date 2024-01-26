import prisma from '../services/prisma.js';
import adminSettings from '../adminSettings.js';

const secretRegex = /^\/api\/secret$/i;

const errorMessage = 'Access denied. You are not allowed to create secrets. 🥲';

export default async function readOnlyHandler(request, reply) {
    const { url } = request;

    const isSecretCreation = request.method === 'POST' && secretRegex.test(url);

    const username = request?.user?.username ?? null;

    if (isSecretCreation && !username && adminSettings.get('read_only')) {
        return reply.code(403).send({ error: errorMessage });
    }

    if (username) {
        const user = await prisma.user.findFirst({
            where: { username },
        });

        if (
            !['admin', 'creator'].includes(user?.role) &&
            adminSettings.get('read_only') &&
            isSecretCreation
        ) {
            return reply.code(403).send({ error: errorMessage });
        }
    }
}
