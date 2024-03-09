import emailValidator from 'email-validator';
import { compare, hash } from '../helpers/password.js';
import prisma from '../services/prisma.js';

const PASSWORD_LENGTH = 5;

async function account(fastify) {
    fastify.get(
        '/',
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
                    email: user.email,
                    generated: user.generated,
                },
            };
        }
    );

    fastify.put(
        '/update',
        {
            preValidation: [fastify.authenticate],
            schema: {
                body: {
                    type: 'object',
                    required: ['currentPassword', 'newPassword', 'confirmNewPassword', 'email'],
                    properties: {
                        currentPassword: { type: 'string', default: '' },
                        newPassword: { type: 'string', maxLength: 50, minLength: 5, default: '' },
                        confirmNewPassword: { type: 'string', default: '' },
                        email: { type: 'string', default: '' },
                        generated: { type: 'boolean', default: false },
                    },
                },
            },
        },
        async (request, reply) => {
            const { currentPassword, newPassword, email, confirmNewPassword, generated } =
                request.body;

            const data = {
                generated,
            };

            const user = await prisma.user.findFirst({
                where: { username: request.user.username },
            });

            if (!currentPassword || !user || !(await compare(currentPassword, user.password))) {
                return reply
                    .code(401)
                    .send({ type: 'currentPassword', error: 'Incorrect password' });
            }

            if (newPassword) {
                data.password = await hash(newPassword);
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

            if (newPassword !== confirmNewPassword) {
                return reply.code(400).send({
                    type: 'confirmNewPassword',
                    error: `The password and confirmation password do not match.`,
                });
            }

            const userData = await prisma.user.update({
                where: { username: request.user.username },
                data,
            });

            return {
                user: {
                    username: userData.username,
                    email: userData.email,
                    generated: userData.generated,
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
            const user = await prisma.user.delete({ where: { username: request.user.username } });

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
