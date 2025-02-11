import { getCacheKey, getFromCache, setCache } from '../helpers/cache.js';
import prisma from '../services/prisma.js';

async function statistics(fastify) {
    fastify.get(
        '/',
        {
            preValidation: [fastify.authenticate],
        },
        async (_, reply) => {
            const cacheKey = getCacheKey('stats');
            const cachedData = getFromCache(cacheKey);

            if (cachedData) {
                return reply.send(cachedData);
            }

            const [
                totalSecretsCreated,
                activeSecrets,
                isPublicSecrets,
                totalUsers,
                totalFiles,
                secretsWithPassword,
                secretsWithIpRestriction,
                averageMaxViewsPerSecret,
            ] = await Promise.all([
                prisma.statistic.findMany(),
                prisma.secret.count(),
                prisma.secret.count({ where: { isPublic: true } }),
                prisma.user.count(),
                prisma.file.count(),
                prisma.secret.count({ where: { NOT: { password: null } } }),
                prisma.secret.count({
                    where: {
                        AND: [
                            {
                                allowed_ip: {
                                    not: null,
                                },
                            },
                            {
                                allowed_ip: {
                                    not: '',
                                },
                            },
                        ],
                    },
                }),
                prisma.secret.aggregate({
                    _avg: {
                        maxViews: true,
                    },
                }),
            ]);

            const [total = { value: 0 }] = totalSecretsCreated;
            const { value } = total;

            const stats = {
                totalSecretsCreated: value,
                activeSecrets,
                isPublicSecrets,
                totalUsers,
                totalFiles,
                secretsWithPassword,
                secretsWithIpRestriction,
                averageMaxViewsPerSecret: Math.round(averageMaxViewsPerSecret._avg.maxViews || 0),
            };

            setCache(cacheKey, stats);

            return reply.code(200).send(stats);
        }
    );
}

export default statistics;
