import { createMiddleware } from 'hono/factory';
import { auth } from '../auth';
import prisma from '../lib/db';

type Env = {
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
        session: typeof auth.$Infer.Session.session | null
    }
}

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
});

export const checkAdmin = createMiddleware<Env>(async (c, next) => {
    const sessionUser = c.get('user');
    if (!sessionUser) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { role: true }
    });

    if (!user || user.role !== 'admin') {
        return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
});