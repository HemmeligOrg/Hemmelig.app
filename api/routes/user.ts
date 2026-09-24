import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { auth } from '../auth';
import {
    AdminUserError,
    banUserAsAdmin,
    createUserAsAdmin,
    deleteUserAsAdmin,
    setUserPasswordAsAdmin,
    unbanUserAsAdmin,
} from '../lib/admin-users';
import prisma from '../lib/db';
import { authMiddleware, checkAdmin } from '../middlewares/auth';
import { idParamSchema } from '../validations/shared';
import {
    banUserSchema,
    createUserSchema,
    setUserPasswordSchema,
    updateUserSchema,
} from '../validations/user';

type Env = {
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
    };
};

/** Returns the message when the admin targets their own account, otherwise null. */
const selfActionError = (currentUserId: string | undefined, targetId: string, message: string) =>
    currentUserId === targetId ? message : null;

/** Maps an error from an admin action to a JSON error and a status code. */
const toAdminError = (error: unknown): { message: string; status: 400 | 404 | 409 | 500 } => {
    if (error instanceof AdminUserError) {
        return { message: error.message, status: error.status };
    }

    const code = (error as { code?: string } | null)?.code;
    if (code === 'P2025') {
        return { message: 'User not found', status: 404 };
    }
    if (code === 'P2002') {
        return { message: 'A user with this username or email already exists', status: 409 };
    }

    console.error('Admin user action failed:', error);
    return { message: 'Failed to process the operation', status: 500 };
};

// Admin user management. Accepts an admin session or an admin's API key.
export const userRoute = new Hono<Env>()
    .use(authMiddleware)
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
    .post('/', zValidator('json', createUserSchema), async (c) => {
        try {
            const user = await createUserAsAdmin(c.req.valid('json'));
            return c.json(user, 201);
        } catch (error) {
            const { message, status } = toAdminError(error);
            return c.json({ error: message }, status);
        }
    })
    .put(
        '/:id',
        zValidator('param', idParamSchema),
        zValidator('json', updateUserSchema),
        async (c) => {
            const { id } = c.req.valid('param');
            const { username, email, role } = c.req.valid('json');

            if (role && role !== 'admin') {
                const selfError = selfActionError(
                    c.get('user')?.id,
                    id,
                    'You cannot remove your own admin role.'
                );
                if (selfError) return c.json({ error: selfError }, 400);
            }

            try {
                const user = await prisma.user.update({
                    where: { id },
                    data: {
                        ...(username && { username: username.toLowerCase() }),
                        ...(email && { email }),
                        ...(role && { role }),
                    },
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
            } catch (error) {
                const { message, status } = toAdminError(error);
                return c.json({ error: message }, status);
            }
        }
    )
    .delete('/:id', zValidator('param', idParamSchema), async (c) => {
        const { id } = c.req.valid('param');
        const selfError = selfActionError(
            c.get('user')?.id,
            id,
            'You cannot delete your own account here.'
        );
        if (selfError) return c.json({ error: selfError }, 400);

        try {
            await deleteUserAsAdmin(id);
            return c.json({ success: true });
        } catch (error) {
            const { message, status } = toAdminError(error);
            return c.json({ error: message }, status);
        }
    })
    .post(
        '/:id/ban',
        zValidator('param', idParamSchema),
        zValidator('json', banUserSchema),
        async (c) => {
            const { id } = c.req.valid('param');
            const selfError = selfActionError(c.get('user')?.id, id, 'You cannot ban yourself.');
            if (selfError) return c.json({ error: selfError }, 400);

            try {
                const user = await banUserAsAdmin(id, c.req.valid('json'));
                return c.json(user);
            } catch (error) {
                const { message, status } = toAdminError(error);
                return c.json({ error: message }, status);
            }
        }
    )
    .post('/:id/unban', zValidator('param', idParamSchema), async (c) => {
        const { id } = c.req.valid('param');

        try {
            const user = await unbanUserAsAdmin(id);
            return c.json(user);
        } catch (error) {
            const { message, status } = toAdminError(error);
            return c.json({ error: message }, status);
        }
    })
    .put(
        '/:id/password',
        zValidator('param', idParamSchema),
        zValidator('json', setUserPasswordSchema),
        async (c) => {
            const { id } = c.req.valid('param');

            try {
                await setUserPasswordAsAdmin(id, c.req.valid('json').password);
                return c.json({ success: true });
            } catch (error) {
                const { message, status } = toAdminError(error);
                return c.json({ error: message }, status);
            }
        }
    );
