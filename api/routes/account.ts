import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { auth } from '../auth';
import prisma from '../lib/db';
import { handleNotFound } from '../lib/utils';
import { authMiddleware } from '../middlewares/auth';
import { updateAccountSchema, updatePasswordSchema } from '../validations/account';

const app = new Hono<{
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
    };
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
        // Check if username is taken by another user
        if (username) {
            const existingUser = await prisma.user.findUnique({
                where: { username },
                select: { id: true },
            });
            if (existingUser && existingUser.id !== user.id) {
                return c.json({ error: 'Username is already taken' }, 409);
            }
        }

        // Check if email is taken by another user
        if (email) {
            const existingEmail = await prisma.user.findFirst({
                where: { email },
                select: { id: true },
            });
            if (existingEmail && existingEmail.id !== user.id) {
                return c.json({ error: 'Email is already taken' }, 409);
            }
        }

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
        return handleNotFound(error as Error & { code?: string }, c);
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
        // Use better-auth's changePassword API
        const result = await auth.api.changePassword({
            body: {
                currentPassword,
                newPassword,
            },
            headers: c.req.raw.headers,
        });

        if (!result) {
            return c.json({ error: 'Failed to change password' }, 500);
        }

        return c.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Failed to update password:', error);
        const message = error instanceof Error ? error.message : 'Failed to update password';
        return c.json({ error: message }, 500);
    }
});

// Delete user account
app.delete('/', authMiddleware, async (c) => {
    const user = c.get('user');

    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
        await prisma.user.delete({
            where: { id: user.id },
        });

        return c.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Failed to delete account:', error);
        return handleNotFound(error as Error & { code?: string }, c);
    }
});

export default app;
