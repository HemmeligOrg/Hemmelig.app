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

        const token = await fastify.jwt.sign(
            {
                username,
            },
            { expiresIn: '7d' } // expires in seven days
        );

        return { token };
    });

    fastify.post('/signin', async (request, reply) => {
        const { username = '', password = '' } = request.body;

        const user = await redis.getUser(username);

        if (!user || !(await compare(password, user.password))) {
            return reply.code(401).send({ error: 'Incorrect username or password.' });
        }

        const token = fastify.jwt.sign(
            {
                username,
            },
            { expiresIn: '7d' }
        );

        return { token };
    });

    fastify.get(
        '/verify',
        {
            preValidation: [fastify.authenticate],
        },
        async () => {
            return { status: 'verified' };
        }
    );
}

module.exports = authentication;
