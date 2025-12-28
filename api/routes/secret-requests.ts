import { zValidator } from '@hono/zod-validator';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { Hono } from 'hono';
import { auth } from '../auth';
import prisma from '../lib/db';
import { authMiddleware } from '../middlewares/auth';
import {
    createSecretRequestSchema,
    processSecretRequestsQueryParams,
    secretRequestIdParamSchema,
    secretRequestsQuerySchema,
    secretRequestTokenQuerySchema,
    submitSecretRequestSchema,
} from '../validations/secret-requests';

// Webhook payload for secret request fulfillment
interface SecretRequestWebhookPayload {
    event: 'secret_request.fulfilled';
    timestamp: string;
    request: {
        id: string;
        title: string;
        createdAt: string;
        fulfilledAt: string;
    };
    secret: {
        id: string;
        maxViews: number;
        expiresAt: string;
    };
}

// Send webhook notification when a secret request is fulfilled
async function sendSecretRequestWebhook(
    webhookUrl: string,
    webhookSecret: string,
    payload: SecretRequestWebhookPayload
): Promise<void> {
    try {
        const timestamp = Math.floor(Date.now() / 1000);
        const payloadString = JSON.stringify(payload);
        const signedPayload = `${timestamp}.${payloadString}`;
        const signature = createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Hemmelig-Event': 'secret_request.fulfilled',
            'X-Hemmelig-Signature': `sha256=${signature}`,
            'X-Hemmelig-Timestamp': timestamp.toString(),
            'X-Hemmelig-Request-Id': payload.request.id,
            'User-Agent': 'Hemmelig-Webhook/1.0',
        };

        // Retry with exponential backoff
        const maxRetries = 3;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers,
                    body: payloadString,
                    signal: AbortSignal.timeout(5000), // 5 second timeout to prevent slow-loris
                    redirect: 'error', // Prevent SSRF via open redirects
                });

                if (response.ok) return;

                // Don't retry for client errors (4xx)
                if (response.status >= 400 && response.status < 500) {
                    console.error(`Secret request webhook delivery failed: ${response.status}`);
                    return;
                }
            } catch (error) {
                if (attempt === maxRetries - 1) {
                    console.error('Secret request webhook delivery failed after retries:', error);
                }
            }

            // Exponential backoff: 1s, 2s, 4s
            await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
    } catch (error) {
        console.error('Error preparing secret request webhook:', error);
    }
}

// Secure token comparison - constant time for all inputs
function validateToken(provided: string, stored: string): boolean {
    try {
        // Pad to same length to prevent timing leaks from length comparison
        const providedBuf = Buffer.alloc(32);
        const storedBuf = Buffer.alloc(32);

        const providedBytes = Buffer.from(provided, 'hex');
        const storedBytes = Buffer.from(stored, 'hex');

        // Only copy valid bytes, rest stays as zeros
        if (providedBytes.length === 32) providedBytes.copy(providedBuf);
        if (storedBytes.length === 32) storedBytes.copy(storedBuf);

        // Always do the comparison, even if lengths were wrong
        const match = timingSafeEqual(providedBuf, storedBuf);

        // Only return true if lengths were correct AND content matches
        return providedBytes.length === 32 && storedBytes.length === 32 && match;
    } catch {
        return false;
    }
}

const app = new Hono<{
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
    };
}>()
    // List user's secret requests (authenticated)
    .get('/', authMiddleware, zValidator('query', secretRequestsQuerySchema), async (c) => {
        try {
            const user = c.get('user')!; // authMiddleware guarantees user exists

            const validatedQuery = c.req.valid('query');
            const { skip, take, status } = processSecretRequestsQueryParams(validatedQuery);

            const whereClause: { userId: string; status?: string } = { userId: user.id };
            if (status && status !== 'all') {
                whereClause.status = status;
            }

            const [items, total] = await Promise.all([
                prisma.secretRequest.findMany({
                    where: whereClause,
                    skip,
                    take,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        status: true,
                        maxViews: true,
                        expiresIn: true,
                        webhookUrl: true,
                        createdAt: true,
                        expiresAt: true,
                        fulfilledAt: true,
                        secretId: true,
                    },
                }),
                prisma.secretRequest.count({ where: whereClause }),
            ]);

            return c.json({
                data: items,
                meta: {
                    total,
                    skip,
                    take,
                    page: Math.floor(skip / take) + 1,
                    totalPages: Math.ceil(total / take),
                },
            });
        } catch (error) {
            console.error('Failed to retrieve secret requests:', error);
            return c.json({ error: 'Failed to retrieve secret requests' }, 500);
        }
    })
    // Create new secret request (authenticated)
    .post('/', authMiddleware, zValidator('json', createSecretRequestSchema), async (c) => {
        try {
            const user = c.get('user')!; // authMiddleware guarantees user exists

            const data = c.req.valid('json');

            // Generate secure token (64 hex chars = 32 bytes)
            const token = randomBytes(32).toString('hex');

            // Generate webhook secret if webhook URL is provided
            const webhookSecret = data.webhookUrl ? randomBytes(32).toString('hex') : null;

            const request = await prisma.secretRequest.create({
                data: {
                    title: data.title,
                    description: data.description,
                    maxViews: data.maxViews,
                    expiresIn: data.expiresIn,
                    allowedIp: data.allowedIp,
                    preventBurn: data.preventBurn,
                    webhookUrl: data.webhookUrl,
                    webhookSecret,
                    token,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + data.validFor * 1000),
                },
            });

            // Get the base URL from the request
            const origin = c.req.header('origin') || process.env.HEMMELIG_BASE_URL || '';

            return c.json(
                {
                    id: request.id,
                    creatorLink: `${origin}/request/${request.id}?token=${token}`,
                    webhookSecret, // Return once so requester can configure their webhook receiver
                    expiresAt: request.expiresAt,
                },
                201
            );
        } catch (error) {
            console.error('Failed to create secret request:', error);
            return c.json({ error: 'Failed to create secret request' }, 500);
        }
    })
    // Get single secret request details (authenticated, owner only)
    .get('/:id', authMiddleware, zValidator('param', secretRequestIdParamSchema), async (c) => {
        try {
            const user = c.get('user')!;
            const { id } = c.req.valid('param');

            const request = await prisma.secretRequest.findUnique({
                where: { id },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    maxViews: true,
                    expiresIn: true,
                    preventBurn: true,
                    webhookUrl: true,
                    token: true,
                    createdAt: true,
                    expiresAt: true,
                    fulfilledAt: true,
                    secretId: true,
                    userId: true,
                    allowedIp: true,
                },
            });

            if (!request) {
                return c.json({ error: 'Secret request not found' }, 404);
            }

            if (request.userId !== user.id) {
                return c.json({ error: 'Forbidden' }, 403);
            }

            // Get the base URL from the request
            const origin = c.req.header('origin') || process.env.HEMMELIG_BASE_URL || '';

            return c.json({
                ...request,
                creatorLink: `${origin}/request/${request.id}?token=${request.token}`,
            });
        } catch (error) {
            console.error('Failed to retrieve secret request:', error);
            return c.json({ error: 'Failed to retrieve secret request' }, 500);
        }
    })
    // Cancel/delete secret request (authenticated, owner only)
    .delete('/:id', authMiddleware, zValidator('param', secretRequestIdParamSchema), async (c) => {
        try {
            const user = c.get('user')!;
            const { id } = c.req.valid('param');

            const request = await prisma.secretRequest.findUnique({
                where: { id },
                select: { userId: true, status: true },
            });

            if (!request) {
                return c.json({ error: 'Secret request not found' }, 404);
            }

            if (request.userId !== user.id) {
                return c.json({ error: 'Forbidden' }, 403);
            }

            // Only allow cancellation of pending requests
            if (request.status !== 'pending') {
                return c.json({ error: 'Can only cancel pending requests' }, 400);
            }

            await prisma.secretRequest.update({
                where: { id },
                data: { status: 'cancelled' },
            });

            return c.json({ success: true, message: 'Secret request cancelled' });
        } catch (error) {
            console.error('Failed to cancel secret request:', error);
            return c.json({ error: 'Failed to cancel secret request' }, 500);
        }
    })
    // Get request info for Creator (public, requires token)
    .get(
        '/:id/info',
        zValidator('param', secretRequestIdParamSchema),
        zValidator('query', secretRequestTokenQuerySchema),
        async (c) => {
            try {
                const { id } = c.req.valid('param');
                const { token } = c.req.valid('query');

                const request = await prisma.secretRequest.findUnique({
                    where: { id },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        status: true,
                        expiresAt: true,
                        token: true,
                    },
                });

                if (!request || !validateToken(token, request.token)) {
                    return c.json({ error: 'Invalid or expired request' }, 404);
                }

                if (request.status !== 'pending') {
                    return c.json({ error: 'Request already fulfilled or expired' }, 410);
                }

                if (new Date() > request.expiresAt) {
                    // Update status to expired
                    await prisma.secretRequest.update({
                        where: { id },
                        data: { status: 'expired' },
                    });
                    return c.json({ error: 'Request has expired' }, 410);
                }

                return c.json({
                    id: request.id,
                    title: request.title,
                    description: request.description,
                });
            } catch (error) {
                console.error('Failed to retrieve secret request info:', error);
                return c.json({ error: 'Failed to retrieve request info' }, 500);
            }
        }
    )
    // Submit encrypted secret for request (public, requires token)
    .post(
        '/:id/submit',
        zValidator('param', secretRequestIdParamSchema),
        zValidator('query', secretRequestTokenQuerySchema),
        zValidator('json', submitSecretRequestSchema),
        async (c) => {
            try {
                const { id } = c.req.valid('param');
                const { token } = c.req.valid('query');
                const { secret, title, salt } = c.req.valid('json');

                // Use interactive transaction to prevent race conditions
                const result = await prisma.$transaction(async (tx) => {
                    const request = await tx.secretRequest.findUnique({
                        where: { id },
                    });

                    if (!request || !validateToken(token, request.token)) {
                        return { error: 'Invalid request', status: 404 };
                    }

                    if (request.status !== 'pending') {
                        return { error: 'Request already fulfilled', status: 410 };
                    }

                    if (new Date() > request.expiresAt) {
                        await tx.secretRequest.update({
                            where: { id },
                            data: { status: 'expired' },
                        });
                        return { error: 'Request has expired', status: 410 };
                    }

                    // Calculate expiration time for the secret
                    const secretExpiresAt = new Date(Date.now() + request.expiresIn * 1000);

                    // Create secret and update request atomically
                    const createdSecret = await tx.secrets.create({
                        data: {
                            secret: Buffer.from(secret),
                            title: title ? Buffer.from(title) : Buffer.from([]),
                            salt,
                            views: request.maxViews,
                            ipRange: request.allowedIp,
                            isBurnable: !request.preventBurn,
                            expiresAt: secretExpiresAt,
                        },
                    });

                    await tx.secretRequest.update({
                        where: { id },
                        data: {
                            status: 'fulfilled',
                            fulfilledAt: new Date(),
                            secretId: createdSecret.id,
                        },
                    });

                    return { success: true, createdSecret, request, secretExpiresAt };
                });

                if ('error' in result) {
                    return c.json({ error: result.error }, result.status as 404 | 410);
                }

                const { createdSecret, request, secretExpiresAt } = result;

                // Send webhook notification (async, don't block response)
                if (request.webhookUrl && request.webhookSecret) {
                    const webhookPayload: SecretRequestWebhookPayload = {
                        event: 'secret_request.fulfilled',
                        timestamp: new Date().toISOString(),
                        request: {
                            id: request.id,
                            title: request.title,
                            createdAt: request.createdAt.toISOString(),
                            fulfilledAt: new Date().toISOString(),
                        },
                        secret: {
                            id: createdSecret.id,
                            maxViews: request.maxViews,
                            expiresAt: secretExpiresAt.toISOString(),
                        },
                    };

                    sendSecretRequestWebhook(
                        request.webhookUrl,
                        request.webhookSecret,
                        webhookPayload
                    ).catch(console.error);
                }

                // Return secret ID (client will construct full URL with decryption key)
                return c.json({ secretId: createdSecret.id }, 201);
            } catch (error) {
                console.error('Failed to submit secret for request:', error);
                return c.json({ error: 'Failed to submit secret' }, 500);
            }
        }
    );

export default app;
