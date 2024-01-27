import prisma from '../services/prisma.js';

async function statistics(fastify) {
    fastify.get('/', async (_, reply) => {
        const [totalSecretsCreated, activeSecrets, isPublicSecrets] = await Promise.all([
            prisma.statistic.findMany(),
            prisma.secret.count(),
            prisma.secret.count({ where: { isPublic: true } }),
        ]);

        const [total = { value: 0 }] = totalSecretsCreated;
        const { value } = total;

        return reply.code(200).send({ totalSecretsCreated: value, activeSecrets, isPublicSecrets });
    });
}

export default statistics;
