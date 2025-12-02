import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
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
                approved: true,
                createdAt: true,
            }
        });

        return c.json(user);
    })
    .post('/:id/approve', async (c) => {
        const { id } = c.req.param();

        const user = await db.user.update({
            where: { id },
            data: { approved: true },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                banned: true,
                approved: true,
                createdAt: true,
            }
        });

        return c.json(user);
    })
    .post('/:id/reject', zValidator('json', z.object({ reason: z.string().optional() })), async (c) => {
        const { id } = c.req.param();
        
        // Delete the user if rejected
        await db.user.delete({
            where: { id },
        });

        return c.json({ success: true });
    });
