import prisma from '../services/prisma.js';

async function statistics(fastify) {
    fastify.get('/', async (_, reply) => {
        const [
            totalSecretsCreated,
            activeSecrets,
            isPublicSecrets,
            totalUsers,
            totalFiles,
            secretsWithPassword,
            secretsWithIpRestriction,
            averageViewsPerSecret,
        ] = await Promise.all([
            prisma.statistic.findMany(),
            prisma.secret.count(),
            prisma.secret.count({ where: { isPublic: true } }),
            prisma.user.count(),
            prisma.file.count(),
            prisma.secret.count({ where: { NOT: { password: null } } }),
            prisma.secret.count({
                where: {
                    allowed_ip: {
                        not: null,
                        not: '',
                    },
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

        return reply.code(200).send({
            totalSecretsCreated: value,
            activeSecrets,
            isPublicSecrets,
            totalUsers,
            totalFiles,
            secretsWithPassword,
            secretsWithIpRestriction,
            averageViewsPerSecret: Math.round(averageViewsPerSecret._avg.maxViews || 0),
        });
    });
}

export default statistics;
