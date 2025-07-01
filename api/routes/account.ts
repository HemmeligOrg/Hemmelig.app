import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middlewares/auth';
import { updateAccountSchema } from '../validations/account';
import prisma from '../lib/db';
import { auth } from '../auth';

const app = new Hono<{
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
    }
}>();

// Get user account information
app.get('/', authMiddleware, async (c) => {
    const user = c.get('user');

    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    return c.json({
        username: user.username,
        email: user.email,
    });
});

// Update user account information
app.put('/', authMiddleware, zValidator('json', updateAccountSchema), async (c) => {
    const user = c.get('user');
    const { username, email } = c.req.valid('json');

    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                username,
                email,
            },
        });

        return c.json({
            username: updatedUser.username,
            email: updatedUser.email,
        });
    } catch (error) {
        return c.json({ error: 'Failed to update account' }, 500);
    }
});

export default app;
