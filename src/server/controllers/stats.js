import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function statistics(fastify) {
    fastify.get('/secrets_created', async (_, reply) => {
        const statistics = await prisma.statistic.findMany();

        return reply.code(200).send(statistics);
    });
}

export default statistics;
