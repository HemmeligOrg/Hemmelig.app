const redis = require('../services/redis');
const { hash, compare } = require('../helpers/password');

const validUsername = new RegExp('^[A-Za-z0-9_-]*$');

const PASSWORD_LENGTH = 5;

async function authentication(fastify) {
    fastify.post('/signup', async (request, reply) => {
        const { username = '', password = '' } = request.body;

        if (!validUsername.test(username)) {
            return reply.code(403).send({ error: 'Not a valid username' });
        }

        if (password.length < PASSWORD_LENGTH) {
            return reply
                .code(403)
                .send({ error: `Password has to be longer than ${PASSWORD_LENGTH} characters` });
        }

        if (await redis.getUser(username)) {
            return reply.code(403).send({ error: `This username has already been taken.` });
        }

        const userPassword = await hash(password);

        const user = await redis.createUser(username, userPassword);

        if (!user) {
            return reply.code(403).send({
                error: 'Something happened while creating a new user. Please try again later.',
            });
        }

        const token = await reply.jwtSign({
            username,
        });

        reply
            .setCookie('_hemmelig_auth_token', token, {
                domain: request.hostname,
                path: '/',
                secure: true, // send cookie over HTTPS only
                httpOnly: true,
                sameSite: true, // alternative CSRF protection
            })
            .code(200)
            .send({ token });
    });

    fastify.post('/signin', async (request, reply) => {
        const { username = '', password = '' } = request.body;

        const user = await redis.getUser(username);

        if (!user || !(await compare(password, user.password))) {
            return reply.code(401).send({ error: 'Incorrect username or password.' });
        }

        const token = fastify.jwt.sign({
            username,
        });

        return { token };
    });
}

module.exports = authentication;
