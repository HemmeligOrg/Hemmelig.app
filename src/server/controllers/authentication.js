import emailValidator from 'email-validator';
import validator from 'validator';
import config from 'config';

import * as redis from '../services/redis.js';
import { hash, compare } from '../helpers/password.js';

const validUsername = new RegExp('^[A-Za-z0-9_-]*$');

const PASSWORD_LENGTH = 5;
const USERNAME_LENGTH = 4;

const COOKIE_KEY = config.get('jwt.cookie');

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

            if (await redis.getUser(username)) {
                return reply
                    .code(403)
                    .send({ type: 'username', error: `This username has already been taken.` });
            }

            const users = await redis.getAllUsers();
            if (users.filter((user) => user && user.email === email).length > 0) {
                return reply
                    .code(403)
                    .send({ type: 'email', error: `This email has already been registered.` });
            }

            const userPassword = await hash(validator.escape(password));

            const user = await redis.createUser(username, email, userPassword);

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

            reply
                .setCookie(COOKIE_KEY, token, {
                    domain: config.get('host'),
                    path: '/',
                    secure: 'auto',
                    sameSite: 'Strict',
                    httpOnly: true,
                })
                .code(200)
                .send({
                    username,
                });
        }
    );

    fastify.post('/signin', async (request, reply) => {
        const { username = '', password = '' } = request.body;

        const user = await redis.getUser(validator.escape(username));

        if (!user || !(await compare(validator.escape(password), user.password))) {
            return reply.code(401).send({ error: 'Incorrect username or password.' });
        }

        const token = await reply.jwtSign(
            {
                username,
            },
            { expiresIn: '7d' }
        );

        reply
            .setCookie(COOKIE_KEY, token, {
                domain: config.get('host'),
                path: '/',
                secure: 'auto',
                sameSite: 'Strict',
                httpOnly: true,
            })
            .code(200)
            .send({
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
            const user = await redis.getUser(validator.escape(request.user.username));

            return {
                username: user.username,
            };
        }
    );
}

export default authentication;
