import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import prisma from '../lib/db';
import { checkAdmin } from '../middlewares/auth';
import { idParamSchema } from '../validations/shared';
import { updateUserSchema } from '../validations/user';

export const userRoute = new Hono()
    .use(checkAdmin)
    .get(
        '/',
        zValidator(
            'query',
            z.object({
                page: z.coerce.number().min(1).default(1),
                pageSize: z.coerce.number().min(1).max(100).default(10),
                search: z.string().max(100).optional(),
            })
        ),
        async (c) => {
            const { page, pageSize, search } = c.req.valid('query');
            const skip = (page - 1) * pageSize;

            const where = search
                ? {
                      OR: [
                          { username: { contains: search } },
                          { email: { contains: search } },
                          { name: { contains: search } },
                      ],
                  }
                : {};

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: pageSize,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true,
                        banned: true,
                        createdAt: true,
                    },
                }),
                prisma.user.count({ where }),
            ]);

            return c.json({
                users,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            });
        }
    )
    .put(
        '/:id',
        zValidator('param', idParamSchema),
        zValidator('json', updateUserSchema),
        async (c) => {
            const { id } = c.req.valid('param');
            const { username, email } = c.req.valid('json');

            const data = {
                ...(username && { username }),
                ...(email && { email }),
            };

            const user = await prisma.user.update({
                where: { id },
                data,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    banned: true,
                    createdAt: true,
                },
            });

            return c.json(user);
        }
    );
