import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import db from '../lib/db';
import { authMiddleware, checkAdmin } from '../middlewares/auth';

const createInviteSchema = z.object({
    maxUses: z.number().int().min(1).max(100).optional().default(1),
    expiresInDays: z.number().int().min(1).max(365).optional(),
});

// Public route for validating invite codes (no auth required)
export const invitePublicRoute = new Hono()
    .post('/validate', zValidator('json', z.object({ code: z.string() })), async (c) => {
        const { code } = c.req.valid('json');

        const invite = await db.inviteCode.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!invite || !invite.isActive) {
            return c.json({ valid: false, error: 'Invalid invite code' }, 400);
        }

        if (invite.expiresAt && new Date() > invite.expiresAt) {
            return c.json({ valid: false, error: 'Invite code has expired' }, 400);
        }

        if (invite.maxUses && invite.uses >= invite.maxUses) {
            return c.json({ valid: false, error: 'Invite code has reached maximum uses' }, 400);
        }

        return c.json({ valid: true });
    })
    // Use an invite code after successful registration
    .post('/use', zValidator('json', z.object({ code: z.string(), userId: z.string() })), async (c) => {
        const { code, userId } = c.req.valid('json');

        const invite = await db.inviteCode.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!invite || !invite.isActive) {
            return c.json({ success: false, error: 'Invalid invite code' }, 400);
        }

        if (invite.expiresAt && new Date() > invite.expiresAt) {
            return c.json({ success: false, error: 'Invite code has expired' }, 400);
        }

        if (invite.maxUses && invite.uses >= invite.maxUses) {
            return c.json({ success: false, error: 'Invite code has reached maximum uses' }, 400);
        }

        // Increment uses and link to user
        await db.$transaction([
            db.inviteCode.update({
                where: { id: invite.id },
                data: { uses: { increment: 1 } },
            }),
            db.user.update({
                where: { id: userId },
                data: { inviteCodeUsed: code.toUpperCase() },
            }),
        ]);

        return c.json({ success: true });
    });

// Protected routes for admin invite management
export const inviteRoute = new Hono()
    .use(authMiddleware)
    .use(checkAdmin)
    // GET /api/invites - List all invite codes
    .get('/', async (c) => {
        const invites = await db.inviteCode.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return c.json(invites);
    })
    // POST /api/invites - Create new invite code
    .post('/', zValidator('json', createInviteSchema), async (c) => {
        const { maxUses, expiresInDays } = c.req.valid('json');
        const user = c.get('user');

        const code = nanoid(12).toUpperCase();
        const expiresAt = expiresInDays
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
            : null;

        const invite = await db.inviteCode.create({
            data: {
                code,
                maxUses,
                expiresAt,
                createdBy: user.id,
            },
        });

        return c.json(invite, 201);
    })
    // DELETE /api/invites/:id - Delete/deactivate invite code
    .delete('/:id', async (c) => {
        const { id } = c.req.param();

        await db.inviteCode.update({
            where: { id },
            data: { isActive: false },
        });

        return c.json({ success: true });
    });
