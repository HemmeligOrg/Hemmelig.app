import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middlewares/auth';
import { updateAccountSchema, updatePasswordSchema } from '../validations/account';
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
        console.error('Failed to update account:', error);
        return c.json({ error: 'Failed to update account' }, 500);
    }
});

// Update user password
app.put('/password', authMiddleware, zValidator('json', updatePasswordSchema), async (c) => {
    const user = c.get('user');
    const { currentPassword, newPassword } = c.req.valid('json');

    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
        const ctx = await auth.$context;
        const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                accounts: true
            }
        });

        const currentPasswordHash = existingUser?.accounts?.[0]?.password;
        if (!existingUser || !currentPasswordHash) {
            return c.json({ error: 'User not found or no password set' }, 404);
        }

        const isCurrentPasswordValid = await ctx.password.verify({ hash: currentPasswordHash, password: currentPassword });

        if (!isCurrentPasswordValid) {
            return c.json({ error: 'Invalid current password' }, 400);
        }

        const newPasswordHash = await ctx.password.hash(newPassword);
        await ctx.internalAdapter.updatePassword(user.id, newPasswordHash);

        return c.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Failed to update password:', error);
        return c.json({ error: 'Failed to update password' }, 500);
    }
});

export default app;
