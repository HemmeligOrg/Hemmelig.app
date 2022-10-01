import emailValidator from 'email-validator';
import { hash, compare } from '../helpers/password.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const validUsername = new RegExp('^[A-Za-z0-9_-]*$');

const PASSWORD_LENGTH = 5;
const USERNAME_LENGTH = 4;

async function authentication(fastify) {
    fastify.post(
        '/signup',
        {
            preValidation: [fastify.rateLimit],
        },
        async (request, reply) => {
            const { email = '', username = '', password = '' } = request.body;

            if (!emailValidator.validate(email)) {
                return reply.code(403).send({
                    type: 'email',
                    error: `Your email: "${email}" is not valid.`,
                });
            }

            if (!validUsername.test(username) || username.length < USERNAME_LENGTH) {
                return reply.code(403).send({
                    type: 'username',
                    error: `Username has to be longer than ${USERNAME_LENGTH}, and can only contain these characters. [A-Za-z0-9_-]`,
                });
            }

            if (password.length < PASSWORD_LENGTH) {
                return reply.code(403).send({
                    type: 'password',
                    error: `Password has to be longer than ${PASSWORD_LENGTH} characters`,
                });
            }

            if (await prisma.user.findFirst({ where: { username } })) {
                return reply
                    .code(403)
                    .send({ type: 'username', error: `This username has already been taken.` });
            }

            const userPassword = await hash(password);

            const user = await prisma.user.create({
                data: {
                    username,
                    email,
                    password: userPassword,
                },
            });

            if (!user) {
                return reply.code(403).send({
                    error: 'Something happened while creating a new user. Please try again later.',
                });
            }

            const token = await fastify.jwt.sign(
                {
                    username,
                    email,
                },
                { expiresIn: '7d' } // expires in seven days
            );

            return { token };
        }
    );

    fastify.post('/signin', async (request, reply) => {
        const { username = '', password = '' } = request.body;

        const user = await prisma.user.findFirst({ where: { username } });

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
        async (request) => {
            const user = await prisma.user.findFirst({
                where: { username: request.user.username },
            });
            return {
                user: {
                    username: user.username,
                },
            };
        }
    );
}

export default authentication;
