import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { auth } from '../auth';
import prisma from '../lib/db';
import { unlinkFiles } from '../lib/files';
import { compare, hash } from '../lib/password';
import { buildPaginationMeta } from '../lib/route-utils';
import { resolveSettings } from '../lib/settings';
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
    limitPasswordAttempts?: boolean | null;
    maxPasswordAttempts?: number | null;
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
            const whereClause = { userId: user.id };

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
                meta: buildPaginationMeta(total, options.skip, options.take),
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

                // Atomically retrieve secret and consume view in a single transaction
                const result = await prisma.$transaction(async (tx) => {
                    const item = await tx.secrets.findUnique({
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
                            limitPasswordAttempts: true,
                            maxPasswordAttempts: true,
                            salt: true,
                            files: {
                                select: { id: true, filename: true },
                            },
                        },
                    });

                    if (!item) {
                        return { error: 'Secret not found', status: 404 as const };
                    }

                    // Check if secret has no views remaining (already consumed)
                    if (item.views !== null && item.views <= 0) {
                        return { error: 'Secret not found', status: 404 as const };
                    }

                    // Verify password if required
                    if (item.password) {
                        const isValidPassword = await compare(data.password!, item.password);
                        if (!isValidPassword) {
                            if (!item.limitPasswordAttempts) {
                                return { error: 'Invalid password', status: 401 as const };
                            }

                            // Atomically increment and read back the counter to avoid a
                            // read-then-write race under concurrent guess attempts.
                            const updated = await tx.secrets.update({
                                where: { id },
                                data: { failedPasswordAttempts: { increment: 1 } },
                                select: { failedPasswordAttempts: true },
                            });
                            const maxAttempts = item.maxPasswordAttempts ?? 5;
                            const failedAttempts = updated.failedPasswordAttempts ?? 0;

                            if (failedAttempts >= maxAttempts) {
                                const filesToDelete = await tx.file.findMany({
                                    where: { secrets: { some: { id } } },
                                    select: { id: true, path: true },
                                });

                                if (filesToDelete.length > 0) {
                                    await tx.file.deleteMany({
                                        where: { id: { in: filesToDelete.map((f) => f.id) } },
                                    });
                                }

                                await tx.secrets.delete({ where: { id } });

                                return {
                                    error: 'Secret burned due to too many failed password attempts',
                                    status: 401 as const,
                                    burned: true,
                                    ipRange: item.ipRange,
                                    filesToDelete: filesToDelete.map((f) => f.path),
                                };
                            }

                            return {
                                error: 'Invalid password',
                                status: 401 as const,
                                attemptsRemaining: maxAttempts - failedAttempts,
                            };
                        }
                    }

                    // Consume the view atomically with retrieval
                    const newViews = item.views! - 1;

                    // Decrement views (don't delete yet — files may still need downloading)
                    // The cleanup job handles deletion of secrets with views=0
                    await tx.secrets.update({
                        where: { id },
                        data: { views: newViews },
                    });

                    if (item.isBurnable && newViews <= 0) {
                        // Send webhook for burned secret
                        sendWebhook('secret.burned', {
                            secretId: id,
                            hasPassword: !!item.password,
                            hasIpRestriction: !!item.ipRange,
                        });
                    } else {
                        // Send webhook for viewed secret
                        sendWebhook('secret.viewed', {
                            secretId: id,
                            hasPassword: !!item.password,
                            hasIpRestriction: !!item.ipRange,
                            viewsRemaining: newViews,
                        });
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { password: _password, ...itemWithoutPassword } = item;
                    return {
                        ...itemWithoutPassword,
                        views: newViews,
                        burned: item.isBurnable && newViews <= 0,
                    };
                });

                if ('error' in result) {
                    const { error, status, burned, attemptsRemaining, filesToDelete, ipRange } =
                        result as {
                            error: string;
                            status: 401 | 404;
                            burned?: boolean;
                            attemptsRemaining?: number;
                            filesToDelete?: string[];
                            ipRange?: string | null;
                        };

                    if (filesToDelete && filesToDelete.length > 0) {
                        await unlinkFiles(filesToDelete);
                        sendWebhook('secret.burned', {
                            secretId: id,
                            hasPassword: true,
                            hasIpRestriction: !!ipRange,
                            reason: 'max_password_attempts_exceeded',
                        });
                    }

                    return c.json(
                        {
                            error,
                            ...(burned !== undefined && { burned }),
                            ...(attemptsRemaining !== undefined && { attemptsRemaining }),
                        },
                        status
                    );
                }

                return c.json(result);
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
            const settings = await resolveSettings();
            if (settings?.requireRegisteredUser && !user) {
                return c.json({ error: 'Only registered users can create secrets' }, 401);
            }

            const validatedData = c.req.valid('json');

            // Enforce dynamic maxSecretSize from instance settings (in KB)
            const maxSizeKB = settings?.maxSecretSize ?? 1024;
            const maxSizeBytes = maxSizeKB * 1024;
            if (validatedData.secret.length > maxSizeBytes) {
                return c.json({ error: `Secret exceeds maximum size of ${maxSizeKB} KB` }, 413);
            }

            const {
                expiresAt,
                password,
                fileIds,
                salt,
                title,
                limitPasswordAttempts,
                maxPasswordAttempts,
                ...rest
            } = validatedData;

            const data: SecretCreateData = {
                ...rest,
                salt,
                // Title is required by the database, default to empty Uint8Array if not provided
                title: title ?? new Uint8Array(0),
                password: password ? await hash(password) : null,
                limitPasswordAttempts: password ? (limitPasswordAttempts ?? true) : null,
                maxPasswordAttempts: password ? (maxPasswordAttempts ?? 5) : null,
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

            // Use transaction to prevent race conditions
            const secret = await prisma.$transaction(async (tx) => {
                // Get secret info before deleting for webhook
                const secretData = await tx.secrets.findUnique({
                    where: { id },
                    select: { id: true, password: true, ipRange: true },
                });

                await tx.secrets.delete({ where: { id } });

                return secretData;
            });

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
