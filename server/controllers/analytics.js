import config from 'config';
import crypto from 'crypto';
import { isbot } from 'isbot';
import getClientIp from '../helpers/client-ip.js';
import prisma from '../services/prisma.js';

const { enabled, ipSalt } = config.get('analytics');

function createUniqueId(ip, userAgent) {
    // Use HMAC for secure hashing
    return crypto
        .createHmac('sha256', ipSalt)
        .update(ip + userAgent)
        .digest('hex');
}

// Validate path to prevent malicious inputs
function isValidPath(path) {
    // Only allow paths that start with / and contain safe characters
    const pathRegex = /^\/[a-zA-Z0-9\-_/]*$/;
    return pathRegex.test(path) && path.length <= 255 && !path.includes('/secret');
}

async function analytics(fastify) {
    fastify.post(
        '/track',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['path'],
                    properties: {
                        path: { type: 'string', maxLength: 255 },
                    },
                },
            },
        },
        async (request, reply) => {
            if (!enabled) {
                return reply.code(403).send({ success: false });
            }

            try {
                const { path } = request.body;
                const userAgent = request.headers['user-agent'];
                const uniqueId = createUniqueId(getClientIp(request.headers), userAgent);

                if (isbot(userAgent)) {
                    return reply.code(403).send({ success: false });
                }

                // Validate path
                if (!isValidPath(path)) {
                    return reply.code(400).send({ error: 'Invalid path format' });
                }

                await prisma.visitorAnalytics.create({
                    data: {
                        path,
                        uniqueId,
                    },
                });

                return reply.code(201).send({ success: true });
            } catch (error) {
                console.error('Analytics tracking error:', error);
                return reply.code(500).send({ error: 'Failed to track analytics' });
            }
        }
    );

    // Endpoint to get analytics data (protected, admin only)
    fastify.get(
        '/data',
        {
            preValidation: [fastify.authenticate],
        },
        async (request, reply) => {
            try {
                const user = await prisma.user.findFirst({
                    where: { username: request.user.username },
                });

                if (user.role !== 'admin') {
                    return reply.code(403).send({ error: 'Unauthorized' });
                }

                const analytics = await prisma.visitorAnalytics.findMany({
                    orderBy: {
                        timestamp: 'desc',
                    },
                    take: 1000, // Limit to last 1000 entries
                });

                return reply.send(analytics);
            } catch (error) {
                console.error('Analytics retrieval error:', error);
                return reply.code(500).send({ error: 'Failed to retrieve analytics' });
            }
        }
    );
}

export default analytics;
