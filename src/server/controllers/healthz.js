import prisma from '../services/prisma.js';

async function healthz(fastify) {
    fastify.get('/', async (_, reply) => {
        try {
            const prismaMetrics = await prisma.$metrics.prometheus();

            return reply.code(200).send(prismaMetrics);
        } catch (err) {
            console.error(err);

            return reply.code(503).send({ error: 'Check the logs for errors, plz.' });
        }
    });
}

export default healthz;
