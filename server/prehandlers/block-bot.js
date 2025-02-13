import { isbot } from 'isbot';

// Add bot detection prehandler
export default async function blockBot(request, reply) {
    const userAgent = request.headers['user-agent'];

    if (request.url.includes('/api/secret/') && isbot(userAgent)) {
        return reply.code(403).send({ error: 'Bot access is not allowed' });
    }
}
