import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import prisma from '../lib/db';
import { checkAdmin } from '../middlewares/auth';
import { updateUserSchema } from '../validations/user';

export const userRoute = new Hono()
    .use(checkAdmin)
    .put('/:id', zValidator('param', z.object({ id: z.string() })), zValidator('json', updateUserSchema), async (c) => {
        const { id } = c.req.valid('param');
        const { username, email } = c.req.valid('json');

        try {
            const data: { username?: string; email?: string } = {};
            if (username) data.username = username;
            if (email) data.email = email;

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
                }
            });

            return c.json(user);
        } catch (error) {
            console.error(`Failed to update user ${id}:`, error);
            return c.json({ error: 'Failed to update user' }, 500);
        }
    });
