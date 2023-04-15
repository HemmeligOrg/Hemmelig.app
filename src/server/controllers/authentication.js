import emailValidator from 'email-validator';
import config from 'config';
import prisma from '../services/prisma.js';

import { hash, compare } from '../helpers/password.js';

const validUsername = /^[A-Za-z0-9_-]*$/is;

const PASSWORD_LENGTH = 5;
const USERNAME_LENGTH = 4;

const COOKIE_KEY = config.get('jwt.cookie');
const COOKIE_KEY_PUBLIC = COOKIE_KEY + '_PUBLIC';
const SACRED_COOKIE_SETTINGS = {
    domain: config.get('host'),
    path: '/',
    secure: 'auto',
    sameSite: 'Strict',
    httpOnly: true,
};
const PUBLIC_COOKIE_SETTINGS = {
    domain: config.get('host'),
    path: '/',
    secure: 'auto',
    sameSite: 'Strict',
    httpOnly: false,
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
                role: 'user',
            },
        });

        if (!user) {
            return reply.code(403).send({
                error: 'Something happened while creating a new user. Please try again later.',
            });
        }

        const sacredToken = await reply.jwtSign(
            {
                username: user.username,
                email: user.email,
                user_id: user.id,
            },
            { expiresIn: '7d' } // expires in seven days
        );

        const publicToken = Buffer.from(
            JSON.stringify({
                username: user.username,
            })
        ).toString('base64');

        reply
            .setCookie(COOKIE_KEY, sacredToken, SACRED_COOKIE_SETTINGS)
            .setCookie(COOKIE_KEY_PUBLIC, publicToken, PUBLIC_COOKIE_SETTINGS)
            .code(200)
            .send({
                username: user.username,
            });
    });

    fastify.post('/signin', async (request, reply) => {
        const { username = '', password = '' } = request.body;

        const user = await prisma.user.findFirst({ where: { username } });

        if (!user || !(await compare(password, user.password))) {
            return reply.code(401).send({ error: 'Incorrect username or password.' });
        }

        const sacredToken = await reply.jwtSign(
            {
                username: user.username,
                email: user.email,
                user_id: user.id,
            },
            { expiresIn: '7d' }
        );

        const publicToken = Buffer.from(
            JSON.stringify({
                username: user.username,
            })
        ).toString('base64');

        reply
            .setCookie(COOKIE_KEY, sacredToken, SACRED_COOKIE_SETTINGS)
            .setCookie(COOKIE_KEY_PUBLIC, publicToken, PUBLIC_COOKIE_SETTINGS)
            .code(200)
            .send({
                username,
            });
    });

    fastify.post('/signout', async (request, reply) => {
        reply.clearCookie(COOKIE_KEY_PUBLIC, { path: '/' }).clearCookie(COOKIE_KEY, { path: '/' });

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
                generated: user.generated,
            };
        }
    );
}

export default authentication;
