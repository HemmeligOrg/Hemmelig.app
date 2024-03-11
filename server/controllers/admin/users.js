import { hash } from '../../helpers/password.js';
import prisma from '../../services/prisma.js';

const ALLOWED_ROLES = ['admin', 'creator', 'user'];

const getRedactedUsers = (users) => {
    const redactedUsers = users.map((user) => ({
        email: user.email,
        username: user.username,
        role: user.role,
    }));

    return redactedUsers;
};

async function users(fastify) {
    fastify.get(
        '/',
        {
            preValidation: [fastify.authenticate, fastify.admin],
        },
        async (request, reply) => {
            const { skip = 0, take = 10 } = request.query;

            if (take > 100) {
                return reply.code(403).send({
                    type: 'take',
                    error: 'Not allowed to fetch more users than 100.',
                });
            }

            const users = await prisma.user.findMany({
                skip: Number(skip),
                take: Number(take),
                orderBy: {
                    role: 'asc',
                },
            });

            return getRedactedUsers(users);
        }
    );

    fastify.post(
        '/',
        {
            preValidation: [fastify.authenticate, fastify.admin],
        },
        async (request, reply) => {
            const {
                username = '',
                password = '',
                email = '',
                role = 'user',
                generated = true,
            } = request.body;

            if (!username) {
                return reply.code(403).send({
                    type: 'username',
                    error: 'Missing username',
                });
            }

            if (!password) {
                return reply.code(403).send({
                    type: 'password',
                    error: 'Missing password',
                });
            }

            if (!email) {
                return reply.code(403).send({
                    type: 'email',
                    error: 'Missing email',
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

            if (!ALLOWED_ROLES.includes(role)) {
                return reply.code(409).send({ error: 'Invalid role.' });
            }

            const user = await prisma.user.create({
                data: {
                    username,
                    email,
                    role,
                    password: await hash(password),
                    generated,
                },
            });

            return getRedactedUsers([user]);
        }
    );

    fastify.put(
        '/',
        {
            preValidation: [fastify.authenticate, fastify.admin],
        },
        async (request, reply) => {
            const { username = '', email = '', role = 'user' } = request.body;

            if (!ALLOWED_ROLES.includes(role)) {
                return reply.code(409).send({ error: 'Invalid role.' });
            }

            const updated = await prisma.user.update({
                where: { username },
                data: {
                    email,
                    role,
                },
            });

            return getRedactedUsers([updated]);
        }
    );

    fastify.delete(
        '/',
        {
            preValidation: [fastify.authenticate, fastify.admin],
        },
        async (request) => {
            const { username = '' } = request.body;

            const deleted = await prisma.user.delete({
                where: { username },
            });

            return getRedactedUsers([deleted]);
        }
    );
}

export default users;
