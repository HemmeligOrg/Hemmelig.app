const redis = require('../services/redis');

async function account(fastify) {
    fastify.get(
        '/',
        {
            preValidation: [fastify.authenticate],
        },
        async (request) => {
            const user = await redis.getUser(request.user.username);
            return {
                user: {
                    username: user.username,
                    basicAuthToken: user.basic_auth_token,
                },
            };
        }
    );
}

module.exports = account;
