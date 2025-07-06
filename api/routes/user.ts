import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import db from '../lib/db';
import { checkAdmin } from '../middlewares/auth';
import { updateUserSchema } from '../validations/user';

export const userRoute = new Hono()
    .use(checkAdmin)
    .put('/:id', zValidator('json', updateUserSchema), async (c) => {
        const { id } = c.req.param();
        const { username, email } = c.req.valid('json');

        const data: {
            username?: string;
            email?: string;
        } = {};
        if (username) data.username = username;
        if (email) data.email = email;

        const user = await db.user.update({
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
    });
