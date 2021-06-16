async function account(fastify) {
    fastify.get(
        '/',
        {
            preValidation: [fastify.authenticate],
        },
        async (request, _) => {
            return { status: 'woow, ma, look at me: ' + request.user.username };
        }
    );
}

module.exports = account;
