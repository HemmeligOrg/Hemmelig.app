import * as redis from '../services/redis.js';

async function healthz(fastify) {
    fastify.get('/', async (_, reply) => {
        if (!(await redis.isAlive())) {
            return reply.code(503).send({ error: 'Redis is not running' });
        }

        return { status: 'ok' };
    });
}

export default healthz;
