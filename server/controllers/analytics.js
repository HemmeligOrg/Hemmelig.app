import config from 'config';
import crypto from 'crypto';
import { isbot } from 'isbot';
import { getCacheKey, getFromCache, setCache } from '../helpers/cache.js';
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
                const cacheKey = getCacheKey('data');
                const cachedData = getFromCache(cacheKey);
                if (cachedData) {
                    return reply.send(cachedData);
                }

                const user = await prisma.user.findFirst({
                    where: { username: request.user.username },
                });

                if (user.role !== 'admin' && user.role !== 'creator') {
                    return reply.code(403).send({ error: 'Unauthorized' });
                }

                const analytics = await prisma.visitorAnalytics.findMany({
                    orderBy: {
                        timestamp: 'desc',
                    },
                    take: 1000,
                });

                setCache(cacheKey, analytics);
                return reply.send(analytics);
            } catch (error) {
                console.error('Analytics retrieval error:', error);
                return reply.code(500).send({ error: 'Failed to retrieve analytics' });
            }
        }
    );

    // Endpoint to get aggregated analytics data (protected, admin only)
    fastify.get(
        '/data/aggregate/unique',
        {
            preValidation: [fastify.authenticate],
        },
        async (request, reply) => {
            try {
                const cacheKey = getCacheKey('aggregate_unique');
                const cachedData = getFromCache(cacheKey);
                if (cachedData) {
                    return reply.send(cachedData);
                }

                const user = await prisma.user.findFirst({
                    where: { username: request.user.username },
                });

                if (user.role !== 'admin' && user.role !== 'creator') {
                    return reply.code(403).send({ error: 'Unauthorized' });
                }

                const aggregatedData = await prisma.visitorAnalytics.groupBy({
                    by: ['uniqueId', 'path'],
                    _count: {
                        uniqueId: true,
                    },
                    orderBy: {
                        _count: {
                            uniqueId: 'desc',
                        },
                    },
                    having: {
                        uniqueId: {
                            _count: {
                                gt: 0,
                            },
                        },
                    },
                });

                setCache(cacheKey, aggregatedData);
                return reply.send(aggregatedData);
            } catch (error) {
                console.error('Aggregated analytics retrieval error:', error);
                return reply.code(500).send({ error: 'Failed to retrieve aggregated analytics' });
            }
        }
    );

    fastify.get(
        '/data/aggregate/daily',
        {
            preValidation: [fastify.authenticate],
        },
        async (request, reply) => {
            try {
                const cacheKey = getCacheKey('aggregate_daily');
                const cachedData = getFromCache(cacheKey);
                if (cachedData) {
                    return reply.send(cachedData);
                }

                const user = await prisma.user.findFirst({
                    where: { username: request.user.username },
                });

                if (user.role !== 'admin' && user.role !== 'creator') {
                    return reply.code(403).send({ error: 'Unauthorized' });
                }

                const rawData = await prisma.$queryRaw`
                    SELECT 
                        strftime('%Y-%m-%d', "timestamp" / 1000, 'unixepoch') as date,
                        COUNT(DISTINCT "uniqueId") as unique_visitors,
                        COUNT(*) as total_visits,
                        GROUP_CONCAT(DISTINCT path) as paths
                    FROM "VisitorAnalytics"
                    GROUP BY strftime('%Y-%m-%d', "timestamp" / 1000, 'unixepoch')
                    ORDER BY date DESC
                    LIMIT 30
                `;

                // Convert BigInt to Number before sending
                const aggregatedData = rawData.map((row) => ({
                    date: row.date,
                    unique_visitors: Number(row.unique_visitors),
                    total_visits: Number(row.total_visits),
                    paths: row.paths,
                }));

                setCache(cacheKey, aggregatedData);
                return reply.send(aggregatedData);
            } catch (error) {
                console.error('Daily analytics retrieval error:', error);
                return reply.code(500).send({ error: 'Failed to retrieve daily analytics' });
            }
        }
    );
}

export default analytics;
