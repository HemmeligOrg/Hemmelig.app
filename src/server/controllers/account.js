async function account(fastify) {
    fastify.get('/', async (request, _) => {
        return { status: 'woow, look at me' };
    });
}

module.exports = account;
