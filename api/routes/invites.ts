import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { auth } from '../auth';
import { TIME } from '../lib/constants';
import prisma from '../lib/db';
import { handleNotFound } from '../lib/utils';
import { authMiddleware, checkAdmin } from '../middlewares/auth';
import { idParamSchema } from '../validations/shared';

const createInviteSchema = z.object({
    maxUses: z.number().int().min(1).max(100).optional().default(1),
    expiresInDays: z.number().int().min(1).max(365).optional(),
});

const codeSchema = z.object({ code: z.string() });

// Public route for validating invite codes (no auth required)
export const invitePublicRoute = new Hono()
    .post('/validate', zValidator('json', codeSchema), async (c) => {
        const { code } = c.req.valid('json');

        try {
            const invite = await prisma.inviteCode.findUnique({
                where: { code: code.toUpperCase() },
            });

            if (!invite || !invite.isActive) {
                return c.json({ error: 'Invalid invite code' }, 400);
            }

            if (invite.expiresAt && new Date() > invite.expiresAt) {
                return c.json({ error: 'Invite code has expired' }, 400);
            }

            if (invite.maxUses && invite.uses >= invite.maxUses) {
                return c.json({ error: 'Invite code has reached maximum uses' }, 400);
            }

            return c.json({ valid: true });
        } catch (error) {
            console.error('Failed to validate invite code:', error);
            return c.json({ error: 'Failed to validate invite code' }, 500);
        }
    })
    .post('/use', zValidator('json', codeSchema), async (c) => {
        const { code } = c.req.valid('json');
        const user = c.get('user');
        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const userId = user.id;

        try {
            const invite = await prisma.inviteCode.findUnique({
                where: { code: code.toUpperCase() },
            });

            if (!invite || !invite.isActive) {
                return c.json({ error: 'Invalid invite code' }, 400);
            }

            if (invite.expiresAt && new Date() > invite.expiresAt) {
                return c.json({ error: 'Invite code has expired' }, 400);
            }

            if (invite.maxUses && invite.uses >= invite.maxUses) {
                return c.json({ error: 'Invite code has reached maximum uses' }, 400);
            }

            await prisma.$transaction([
                prisma.inviteCode.update({
                    where: { id: invite.id },
                    data: { uses: { increment: 1 } },
                }),
                prisma.user.update({
                    where: { id: userId },
                    data: { inviteCodeUsed: code.toUpperCase() },
                }),
            ]);

            return c.json({ success: true });
        } catch (error) {
            console.error('Failed to use invite code:', error);
            return c.json({ error: 'Failed to use invite code' }, 500);
        }
    });

// Protected routes for admin invite management
export const inviteRoute = new Hono<{
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
    };
}>()
    .use(authMiddleware)
    .use(checkAdmin)
    .get('/', async (c) => {
        try {
            const invites = await prisma.inviteCode.findMany({
                orderBy: { createdAt: 'desc' },
            });
            return c.json(invites);
        } catch (error) {
            console.error('Failed to list invite codes:', error);
            return c.json({ error: 'Failed to list invite codes' }, 500);
        }
    })
    .post('/', zValidator('json', createInviteSchema), async (c) => {
        const { maxUses, expiresInDays } = c.req.valid('json');
        const user = c.get('user');

        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        try {
            const code = nanoid(12).toUpperCase();
            const expiresAt = expiresInDays
                ? new Date(Date.now() + expiresInDays * TIME.DAY_MS)
                : null;

            const invite = await prisma.inviteCode.create({
                data: {
                    code,
                    maxUses,
                    expiresAt,
                    createdBy: user.id,
                },
            });

            return c.json(invite, 201);
        } catch (error) {
            console.error('Failed to create invite code:', error);
            return c.json({ error: 'Failed to create invite code' }, 500);
        }
    })
    .delete('/:id', zValidator('param', idParamSchema), async (c) => {
        const { id } = c.req.valid('param');

        try {
            await prisma.inviteCode.update({
                where: { id },
                data: { isActive: false },
            });

            return c.json({ success: true });
        } catch (error) {
            console.error(`Failed to delete invite code ${id}:`, error);
            return handleNotFound(error as Error & { code?: string }, c);
        }
    });
