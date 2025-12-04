import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { auth } from '../auth';
import instanceSettings from '../instance-settings';
import prisma from '../lib/db';
import { compare, hash } from '../lib/password';
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

                if (item.password) {
                    const data = c.req.valid('json');
                    const isValidPassword = await compare(data.password!, item.password);

                    if (!isValidPassword) {
                        return c.json({ error: 'Invalid password' }, 401);
                    }
                }

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { password: _password, ...itemWithoutPassword } = item;

                const webhookData = {
                    secretId: item.id,
                    hasPassword: !!item.password,
                    hasIpRestriction: !!item.ipRange,
                    viewsRemaining: item.views! - 1,
                };

                if (item.views! > 1) {
                    await prisma.secrets.update({
                        where: { id: item.id },
                        data: { views: { decrement: 1 } },
                    });
                    // Send webhook for secret view
                    sendWebhook('secret.viewed', webhookData);
                } else if (!item.isBurnable) {
                    // Last view for non-burnable secret
                    // Mark views as 0 but don't delete yet - allow file downloads
                    // The secret will be cleaned up by the expired secrets job
                    // Set expiresAt to now + 5 minutes to give time for file downloads
                    await prisma.secrets.update({
                        where: { id: item.id },
                        data: {
                            views: 0,
                            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes grace period
                        },
                    });
                    // Send webhook for secret burned (last view)
                    sendWebhook('secret.burned', { ...webhookData, viewsRemaining: 0 });
                } else {
                    // Burnable secret on last view - just decrement, don't delete
                    await prisma.secrets.update({
                        where: { id: item.id },
                        data: { views: 0 },
                    });
                    // Send webhook for secret view (burnable secret on last view)
                    sendWebhook('secret.viewed', { ...webhookData, viewsRemaining: 0 });
                }

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
            let settings = instanceSettings.get('instanceSettings');
            if (!settings) {
                // Fetch from database if not cached
                settings = await prisma.instanceSettings.findFirst();
                if (settings) {
                    instanceSettings.set('instanceSettings', settings);
                }
            }
            if (settings?.requireRegisteredUser && !user) {
                return c.json({ error: 'Only registered users can create secrets' }, 401);
            }

            const validatedData = c.req.valid('json');
            const { expiresAt, password, fileIds, salt, ...rest } = validatedData;

            const data: SecretCreateData = {
                ...rest,
                salt,
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
