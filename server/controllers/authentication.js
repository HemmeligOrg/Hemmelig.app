import config from 'config';
import emailValidator from 'email-validator';
import prisma from '../services/prisma.js';

import { compare, hash } from '../helpers/password.js';

export const validUsername = /^(?=.*[a-z])[a-z0-9]+$/is;

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
    fastify.post(
        '/signup',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['email', 'username', 'password'],
                    properties: {
                        email: { type: 'string' },
                        username: { type: 'string', minLength: 4, maxLength: 20 },
                        password: { type: 'string', minLength: 5, maxLength: 50 },
                    },
                },
            },
        },
        async (request, reply) => {
            const { email, username, password } = request.body;

            if (!emailValidator.validate(email)) {
                return reply.code(400).send({
                    type: 'email',
                    message: `Your email: "${email}" is not valid.`,
                });
            }

            if (!validUsername.test(username)) {
                return reply.code(400).send({
                    type: 'username',
                    message: `Username can only contain these characters. [A-Za-z0-9_-]`,
                });
            }

            const userExist = await prisma.user.findFirst({ where: { username } });
            if (userExist) {
                return reply
                    .code(403)
                    .send({ type: 'username', message: `This username has already been taken.` });
            }

            const emailExist = await prisma.user.findFirst({ where: { email } });
            if (emailExist) {
                return reply
                    .code(403)
                    .send({ type: 'email', message: `This email has already been registered.` });
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
                return reply.code(400).send({
                    message:
                        'Something happened while creating a new user. Please try again later.',
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

            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 6);

            const publicToken = Buffer.from(
                JSON.stringify({
                    username: user.username,
                    expirationDate: expirationDate,
                })
            ).toString('base64');

            reply
                .setCookie(COOKIE_KEY, sacredToken, SACRED_COOKIE_SETTINGS)
                .setCookie(COOKIE_KEY_PUBLIC, publicToken, PUBLIC_COOKIE_SETTINGS)
                .code(200)
                .send({
                    username: user.username,
                });
        }
    );

    fastify.post(
        '/signin',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['username', 'password'],
                    properties: {
                        username: { type: 'string' },
                        password: { type: 'string' },
                    },
                },
            },
        },
        async (request, reply) => {
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

            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 6);

            const publicToken = Buffer.from(
                JSON.stringify({
                    username: user.username,
                    expirationDate: expirationDate,
                })
            ).toString('base64');

            reply
                .setCookie(COOKIE_KEY, sacredToken, SACRED_COOKIE_SETTINGS)
                .setCookie(COOKIE_KEY_PUBLIC, publicToken, PUBLIC_COOKIE_SETTINGS)
                .code(200)
                .send({
                    username,
                });
        }
    );

    fastify.post('/signout', async (_, reply) => {
        reply.clearCookie(COOKIE_KEY_PUBLIC, { path: '/' });

        // clear the http only cookie by setting an expired date
        reply.setCookie(COOKIE_KEY, '', { path: '/', expires: new Date(0) });

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

    fastify.get(
        '/refresh',
        {
            preValidation: [fastify.authenticate],
        },
        async (request, reply) => {
            const user = await prisma.user.findFirst({
                where: { username: request.user.username },
            });

            const sacredToken = await reply.jwtSign(
                {
                    username: user.username,
                    email: user.email,
                    user_id: user.id,
                },
                { expiresIn: '7d' }
            );

            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 6);

            const publicToken = Buffer.from(
                JSON.stringify({
                    username: user.username,
                    expirationDate: expirationDate,
                })
            ).toString('base64');

            reply
                .setCookie(COOKIE_KEY, sacredToken, SACRED_COOKIE_SETTINGS)
                .setCookie(COOKIE_KEY_PUBLIC, publicToken, PUBLIC_COOKIE_SETTINGS)
                .code(200)
                .send({
                    username: user.username,
                });
        }
    );
}

export default authentication;
