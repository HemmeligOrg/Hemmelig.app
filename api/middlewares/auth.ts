import { createMiddleware } from 'hono/factory';
import { auth } from '../auth';

type Env = {
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
        session: typeof auth.$Infer.Session.session | null
    }
}

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
    const user = c.get('user')
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401)
    }
    await next()
})
