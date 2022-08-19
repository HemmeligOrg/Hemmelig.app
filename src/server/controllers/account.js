const redis = require('../services/redis');
const validator = require('validator');

async function account(fastify) {
    fastify.get(
        '/',
        {
            preValidation: [fastify.authenticate],
        },
        async (request) => {
            const user = await redis.getUser(validator.escape(request.user.username));

            return {
                user: {
                    username: user.username,
                    basicAuthToken: user.basic_auth_token,
                },
            };
        }
    );

    fastify.post(
        '/delete_user',
        {
            preValidation: [fastify.authenticate],
        },
        async (request) => {
            const user = await redis.getUser(validator.escape(request.user.username));

            await redis.deleteUser(validator.escape(request.user.username));

            return {
                user: {
                    username: user.username,
                    action: 'deleted',
                },
            };
        }
    );
}

module.exports = account;
