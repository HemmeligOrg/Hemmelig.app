import prisma from '../services/prisma.js';

async function statistics(fastify) {
    fastify.get('/', async (_, reply) => {
        const [totalSecretsCreated, activeSecrets] = await Promise.all([
            prisma.statistic.findMany(),
            prisma.secret.count(),
        ]);

        const [total = { value: 0 }] = totalSecretsCreated;
        const { value } = total;

        return reply.code(200).send({ totalSecretsCreated: value, activeSecrets });
    });
}

export default statistics;
