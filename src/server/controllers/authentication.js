import emailValidator from 'email-validator';
import config from 'config';
import { PrismaClient } from '@prisma/client';

import { hash, compare } from '../helpers/password.js';

const prisma = new PrismaClient();

const validUsername = new RegExp('^[A-Za-z0-9_-]*$');

const PASSWORD_LENGTH = 5;
const USERNAME_LENGTH = 4;

const COOKIE_KEY = config.get('jwt.cookie');
const COOKIE_SETTINGS = {
    domain: config.get('host'),
    path: '/',
    secure: 'auto',
    sameSite: 'Strict',
    httpOnly: true,
};

async function authentication(fastify) {
    fastify.post('/signup', async (request, reply) => {
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

        const userExist = await prisma.user.findFirst({ where: { username } });
        if (userExist) {
            return reply
                .code(403)
                .send({ type: 'username', error: `This username has already been taken.` });
        }

        const emailExist = await prisma.user.findFirst({ where: { email } });
        if (emailExist) {
            return reply
                .code(403)
                .send({ type: 'email', error: `This email has already been registered.` });
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

        const token = await reply.jwtSign(
            {
                username,
                email,
            },
            { expiresIn: '7d' } // expires in seven days
        );

        reply.setCookie(COOKIE_KEY, token, COOKIE_SETTINGS).code(200).send({
            username,
        });
    });

    fastify.post('/signin', async (request, reply) => {
        const { username = '', password = '' } = request.body;

        const user = await prisma.user.findFirst({ where: { username } });

        if (!user || !(await compare(password, user.password))) {
            return reply.code(401).send({ error: 'Incorrect username or password.' });
        }

        const token = await reply.jwtSign(
            {
                username,
            },
            { expiresIn: '7d' }
        );

        reply.setCookie(COOKIE_KEY, token, COOKIE_SETTINGS).code(200).send({
            username,
        });
    });

    fastify.post('/signout', async (request, reply) => {
        reply.clearCookie(COOKIE_KEY, { path: '/' });

        return {
            signout: 'ok',
        };
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
                username: user.username,
            };
        }
    );
}

export default authentication;
