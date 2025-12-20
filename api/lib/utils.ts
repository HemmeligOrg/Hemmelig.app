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
    return c.json(
        {
            error: 'Failed to process the operation',
        },
        500
    );
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

/**
 * Check if a URL points to a private/internal address (SSRF protection)
 * @param url URL string to validate
 * @returns true if URL is safe (not internal), false if it's a private/internal address
 */
export const isPublicUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();

        // Block private/internal addresses to prevent SSRF
        const blockedPatterns = [
            // Localhost variants
            /^localhost$/,
            /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
            /^0\.0\.0\.0$/,
            /^::1$/,
            /^\[::1\]$/,
            // Private IPv4 ranges
            /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
            /^192\.168\.\d{1,3}\.\d{1,3}$/,
            /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/,
            // Link-local
            /^169\.254\.\d{1,3}\.\d{1,3}$/,
            /^fe80:/i,
            // Private IPv6
            /^fc00:/i,
            /^fd[0-9a-f]{2}:/i,
            // Special domains
            /\.local$/,
            /\.internal$/,
            /\.localhost$/,
            /\.localdomain$/,
        ];

        return !blockedPatterns.some((pattern) => pattern.test(hostname));
    } catch {
        return false;
    }
};
