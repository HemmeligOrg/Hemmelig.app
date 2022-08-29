import * as redis from '../services/redis.js';

async function statistics(fastify) {
    fastify.get('/secrets_created', async (_, reply) => {
        const statistics = await redis.getStatistics('secrets_created');

        return reply.code(200).send(statistics);
    });
}

export default statistics;
