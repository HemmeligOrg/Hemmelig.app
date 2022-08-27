import validator from 'validator';
import emailValidator from 'email-validator';
import { hash } from '../helpers/password.js';
import * as redis from '../services/redis.js';

const PASSWORD_LENGTH = 5;

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
                    email: user.email,
                },
            };
        }
    );

    fastify.put(
        '/update',
        {
            preValidation: [fastify.authenticate],
        },
        async (request, reply) => {
            const { password = '', email = '' } = request.body;

            const data = {};

            if (password) {
                if (password.length < PASSWORD_LENGTH) {
                    return reply.code(403).send({
                        type: 'password',
                        error: `Password has to be longer than ${PASSWORD_LENGTH} characters`,
                    });
                }

                data.password = await hash(validator.escape(password));
            }

            if (email) {
                if (!emailValidator.validate(email)) {
                    return reply.code(403).send({
                        type: 'email',
                        error: `Your email: "${email}" is not valid.`,
                    });
                }

                data.email = email;
            }

            if (!email && !password) {
                return reply.code(412).send({
                    type: 'no-data',
                    error: `Could not update your profile. Please set the fields you want to update.`,
                });
            }

            const user = await redis.updateUser(validator.escape(request.user.username), data);

            return {
                user: {
                    username: user.username,
                    email: user.email,
                    action: 'updated',
                },
            };
        }
    );

    fastify.post(
        '/delete',
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

export default account;
