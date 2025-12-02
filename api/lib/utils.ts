import { type Context } from 'hono';

/**
 * Handle not found error from Prisma
 * @param error Error from Prisma operation
 * @param c Hono context
 * @returns JSON error response
 */
export const handleNotFound = (error: Error & { code?: string }, c: Context) => {
    // Handle record not found error (Prisma P2025)
    if (error?.code === 'P2025') {
        return c.json({ error: 'Not found' }, 404);
    }

    // Handle other errors
    return c.json({
        error: 'Failed to process the operation',
        details: error.message,
    }, 500);
};

/**
 * Get client IP from request headers
 * @param c Hono context
 * @returns Client IP address
 */
export const getClientIp = (c: Context): string => {
    const forwardedFor = c.req.header('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return (
        c.req.header('x-real-ip') ||
        c.req.header('cf-connecting-ip') ||
        c.req.header('client-ip') ||
        c.req.header('x-client-ip') ||
        c.req.header('x-cluster-client-ip') ||
        c.req.header('forwarded-for') ||
        c.req.header('forwarded') ||
        c.req.header('via') ||
        '127.0.0.1'
    );
};

