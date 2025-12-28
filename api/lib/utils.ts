import dns from 'dns/promises';
import { type Context } from 'hono';
import { isIP } from 'is-ip';

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

// Patterns for private/internal IP addresses
const privateIpPatterns = [
    // Localhost variants
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    /^0\.0\.0\.0$/,
    // Private IPv4 ranges
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    /^192\.168\.\d{1,3}\.\d{1,3}$/,
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/,
    // Link-local IPv4
    /^169\.254\.\d{1,3}\.\d{1,3}$/,
    // IPv6 localhost
    /^::1$/,
    /^\[::1\]$/,
    // IPv6 link-local
    /^fe80:/i,
    // IPv6 private (unique local addresses)
    /^fc00:/i,
    /^fd[0-9a-f]{2}:/i,
];

// Patterns for special domains that should always be blocked
const blockedHostnamePatterns = [
    /^localhost$/,
    /\.local$/,
    /\.internal$/,
    /\.localhost$/,
    /\.localdomain$/,
];

/**
 * Check if an IP address is private/internal
 * @param ip IP address to check
 * @returns true if IP is private/internal
 */
const isPrivateIp = (ip: string): boolean => {
    return privateIpPatterns.some((pattern) => pattern.test(ip));
};

/**
 * Check if a URL points to a private/internal address (SSRF protection)
 * Resolves DNS to check actual IP addresses, preventing DNS rebinding attacks.
 * @param url URL string to validate
 * @returns Promise<true> if URL is safe (not internal), Promise<false> if it's a private/internal address
 */
export const isPublicUrl = async (url: string): Promise<boolean> => {
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();

        // Block special domain patterns (e.g., .local, .localhost)
        if (blockedHostnamePatterns.some((pattern) => pattern.test(hostname))) {
            return false;
        }

        // If hostname is already an IP address, check it directly
        if (isIP(hostname)) {
            return !isPrivateIp(hostname);
        }

        // Resolve DNS to get actual IP addresses
        let addresses: string[] = [];
        try {
            const ipv4Addresses = await dns.resolve4(hostname).catch(() => []);
            const ipv6Addresses = await dns.resolve6(hostname).catch(() => []);
            addresses = [...ipv4Addresses, ...ipv6Addresses];
        } catch {
            // DNS resolution failed - reject for safety
            return false;
        }

        // Require at least one resolvable address
        if (addresses.length === 0) {
            return false;
        }

        // Check all resolved IPs - reject if ANY resolve to private addresses
        return !addresses.some((ip) => isPrivateIp(ip));
    } catch {
        return false;
    }
};
