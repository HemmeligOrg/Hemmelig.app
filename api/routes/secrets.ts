import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { auth } from '../auth';
import prisma from '../lib/db';
import { compare, hash } from '../lib/password';
import { getInstanceSettings } from '../lib/settings';
import { handleNotFound } from '../lib/utils';
import { sendWebhook } from '../lib/webhook';
import { apiKeyOrAuthMiddleware } from '../middlewares/auth';
import { ipRestriction } from '../middlewares/ip-restriction';
import {
    createSecretsSchema,
    getSecretSchema,
    processSecretsQueryParams,
    secretsIdParamSchema,
    secretsQuerySchema,
} from '../validations/secrets';

interface SecretCreateData {
    salt: string;
    secret: Uint8Array;
    title?: Uint8Array | null;
    password: string | null;
    expiresAt: Date;
    views?: number;
    isBurnable?: boolean;
    ipRange?: string | null;
    files?: { connect: { id: string }[] };
    userId?: string;
}

const app = new Hono<{
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
    };
}>()
    .get('/', apiKeyOrAuthMiddleware, zValidator('query', secretsQuerySchema), async (c) => {
        try {
            const user = c.get('user');
            if (!user) {
                return c.json({ error: 'Unauthorized' }, 401);
            }

            const validatedQuery = c.req.valid('query');
            const options = processSecretsQueryParams(validatedQuery);
            const whereClause = { ...options.where, userId: user.id };

            const [items, total] = await Promise.all([
                prisma.secrets.findMany({
                    where: whereClause,
                    skip: options.skip,
                    take: options.take,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        createdAt: true,
                        expiresAt: true,
                        views: true,
                        password: true,
                        ipRange: true,
                        isBurnable: true,
                        _count: {
                            select: { files: true },
                        },
                    },
                }),
                prisma.secrets.count({ where: whereClause }),
            ]);

            const formattedItems = items.map((item) => ({
                id: item.id,
                createdAt: item.createdAt,
                expiresAt: item.expiresAt,
                views: item.views,
                isPasswordProtected: !!item.password,
                ipRange: item.ipRange,
                isBurnable: item.isBurnable,
                fileCount: item._count.files,
            }));

            return c.json({
                data: formattedItems,
                meta: {
                    total,
                    skip: options.skip,
                    take: options.take,
                    page: Math.floor(options.skip / options.take) + 1,
                    totalPages: Math.ceil(total / options.take),
                },
            });
        } catch (error) {
            console.error('Failed to retrieve secrets:', error);
            return c.json(
                {
                    error: 'Failed to retrieve secrets',
                },
                500
            );
        }
    })
    .post(
        '/:id',
        zValidator('param', secretsIdParamSchema),
        zValidator('json', getSecretSchema),
        ipRestriction,
        async (c) => {
            try {
                const { id } = c.req.valid('param');
                const data = c.req.valid('json');

                const item = await prisma.secrets.findUnique({
                    where: { id },
                    select: {
                        id: true,
                        secret: true,
                        title: true,
                        ipRange: true,
                        views: true,
                        expiresAt: true,
                        createdAt: true,
                        isBurnable: true,
                        password: true,
                        salt: true,
                        files: {
                            select: { id: true, filename: true },
                        },
                    },
                });

                if (!item) {
                    return c.json({ error: 'Secret not found' }, 404);
                }

                // Check if secret has no views remaining (already consumed)
                if (item.views !== null && item.views <= 0) {
                    return c.json({ error: 'Secret not found' }, 404);
                }

                // Verify password if required
                if (item.password) {
                    const isValidPassword = await compare(data.password!, item.password);
                    if (!isValidPassword) {
                        return c.json({ error: 'Invalid password' }, 401);
                    }
                }

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { password: _password, ...itemWithoutPassword } = item;

                // Don't decrement views here - client will call /consume after successful decryption
                return c.json(itemWithoutPassword);
            } catch (error) {
                console.error(`Failed to retrieve item ${c.req.param('id')}:`, error);
                return c.json(
                    {
                        error: 'Failed to retrieve item',
                    },
                    500
                );
            }
        }
    )
    .post('/:id/consume', zValidator('param', secretsIdParamSchema), ipRestriction, async (c) => {
        try {
            const { id } = c.req.valid('param');

            // Atomically decrement views and optionally delete if burnable
            const result = await prisma.$transaction(async (tx) => {
                const item = await tx.secrets.findUnique({
                    where: { id },
                    select: {
                        id: true,
                        views: true,
                        isBurnable: true,
                        password: true,
                        ipRange: true,
                    },
                });

                if (!item) {
                    return { error: 'Secret not found', status: 404 };
                }

                // Check if secret has no views remaining
                if (item.views !== null && item.views <= 0) {
                    return { error: 'Secret already consumed', status: 410 };
                }

                const newViews = item.views! - 1;

                // If burnable and last view, delete the secret
                if (item.isBurnable && newViews <= 0) {
                    await tx.secrets.delete({ where: { id } });

                    // Send webhook for burned secret
                    sendWebhook('secret.burned', {
                        secretId: id,
                        hasPassword: !!item.password,
                        hasIpRestriction: !!item.ipRange,
                    });

                    return { burned: true, views: 0 };
                }

                // Otherwise just decrement views
                await tx.secrets.update({
                    where: { id },
                    data: { views: newViews },
                });

                // Send webhook for viewed secret
                sendWebhook('secret.viewed', {
                    secretId: id,
                    hasPassword: !!item.password,
                    hasIpRestriction: !!item.ipRange,
                    viewsRemaining: newViews,
                });

                return { burned: false, views: newViews };
            });

            if ('error' in result) {
                return c.json({ error: result.error }, result.status as 404 | 410);
            }

            return c.json(result);
        } catch (error) {
            console.error(`Failed to consume secret ${c.req.param('id')}:`, error);
            return c.json({ error: 'Failed to consume secret' }, 500);
        }
    })
    .get('/:id/check', zValidator('param', secretsIdParamSchema), ipRestriction, async (c) => {
        try {
            const { id } = c.req.valid('param');

            const item = await prisma.secrets.findUnique({
                where: { id },
                select: {
                    id: true,
                    views: true,
                    title: true,
                    password: true,
                },
            });

            if (!item) {
                return c.json({ error: 'Secret not found' }, 404);
            }

            // Check if secret has no views remaining (already consumed)
            if (item.views !== null && item.views <= 0) {
                return c.json({ error: 'Secret not found' }, 404);
            }

            return c.json({
                views: item.views,
                title: item.title,
                isPasswordProtected: !!item.password,
            });
        } catch (error) {
            console.error(`Failed to check secret ${c.req.param('id')}:`, error);
            return c.json(
                {
                    error: 'Failed to check secret',
                },
                500
            );
        }
    })
    .post('/', zValidator('json', createSecretsSchema), async (c) => {
        try {
            const user = c.get('user');

            // Check if only registered users can create secrets
            const settings = await getInstanceSettings();
            if (settings?.requireRegisteredUser && !user) {
                return c.json({ error: 'Only registered users can create secrets' }, 401);
            }

            const validatedData = c.req.valid('json');
            const { expiresAt, password, fileIds, salt, title, ...rest } = validatedData;

            const data: SecretCreateData = {
                ...rest,
                salt,
                // Title is required by the database, default to empty Uint8Array if not provided
                title: title ?? new Uint8Array(0),
                password: password ? await hash(password) : null,
                expiresAt: new Date(Date.now() + expiresAt * 1000),
                ...(fileIds && {
                    files: { connect: fileIds.map((id: string) => ({ id })) },
                }),
            };

            if (user) {
                data.userId = user.id;
            }

            const item = await prisma.secrets.create({ data });

            return c.json({ id: item.id }, 201);
        } catch (error: unknown) {
            console.error('Failed to create secrets:', error);

            if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
                const prismaError = error as { meta?: { target?: string } };
                return c.json(
                    {
                        error: 'Could not create secrets',
                        details: prismaError.meta?.target,
                    },
                    409
                );
            }

            return c.json(
                {
                    error: 'Failed to create secret',
                },
                500
            );
        }
    })
    .delete('/:id', zValidator('param', secretsIdParamSchema), async (c) => {
        try {
            const { id } = c.req.valid('param');

            // Get secret info before deleting for webhook
            const secret = await prisma.secrets.findUnique({
                where: { id },
                select: { id: true, password: true, ipRange: true },
            });

            await prisma.secrets.delete({ where: { id } });

            // Send webhook for manually burned secret
            if (secret) {
                sendWebhook('secret.burned', {
                    secretId: id,
                    hasPassword: !!secret.password,
                    hasIpRestriction: !!secret.ipRange,
                });
            }

            return c.json({
                success: true,
                message: 'Secret deleted successfully',
            });
        } catch (error) {
            console.error(`Failed to delete secret ${c.req.param('id')}:`, error);
            return handleNotFound(error as Error & { code?: string }, c);
        }
    });

export default app;
