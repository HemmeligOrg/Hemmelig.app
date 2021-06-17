const fp = require('fastify-plugin');
const { getUser } = require('../services/redis');

//TODO: IMPORTANT, in order to make this work we have to allow other requests without the basic auth
//TODO: ONLY from the hostname of the web application
module.exports = fp(async (fastify) => {
    fastify.decorate('basicAuth', async (request, reply) => {
        const { headers } = request;

        if (headers.authorization) {
            const [_, base64Secret] = headers.authorization.split(' ');

            const [user, token] = new Buffer.from(base64Secret, 'base64')
                .toString('utf8')
                .split(':');

            const userData = await getUser(user);
            if (!userData || userData.basic_auth_token !== token) {
                reply.code(401).send({ error: 'Invalid Authorization' });
            }
        }
    });
});
