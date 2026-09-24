import dns from 'dns/promises';
import { type Context } from 'hono';
import ipRangeCheck from 'ip-range-check';
import { isIP } from 'is-ip';
import config from '../config';

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
 * Get the address of the peer that opened the socket.
 * Returns null when the runtime does not expose a socket (for example, tests).
 */
const getPeerAddress = (c: Context): string | null => {
    const incoming = (c.env as { incoming?: { socket?: { remoteAddress?: string } } } | undefined)
        ?.incoming;
    const remoteAddress = incoming?.socket?.remoteAddress;

    if (!remoteAddress) {
        return null;
    }

    // Normalize IPv4-mapped IPv6 addresses (::ffff:127.0.0.1).
    if (remoteAddress.startsWith('::ffff:')) {
        return remoteAddress.slice(7);
    }

    return remoteAddress;
};

const getTrustedProxies = (): string[] => config.get<string[]>('server.trustedProxies', []);

const isTrustedProxy = (ip: string): boolean => {
    const trustedProxies = getTrustedProxies();
    return trustedProxies.length > 0 && trustedProxies.some((proxy) => ipRangeCheck(ip, proxy));
};

/**
 * Get client IP from the connection.
 *
 * The socket address is authoritative. Forwarded headers are trusted only
 * when the peer is a configured trusted proxy, and the chain is walked from
 * right to left while skipping trusted proxies. Configure
 * `HEMMELIG_TRUSTED_PROXIES` when the instance runs behind a reverse proxy.
 * @param c Hono context
 * @returns Client IP address
 */
export const getClientIp = (c: Context): string => {
    const peer = getPeerAddress(c);

    if (!peer || !isTrustedProxy(peer)) {
        return peer || '127.0.0.1';
    }

    const forwardedFor = c.req.header('x-forwarded-for');
    if (forwardedFor) {
        const chain = forwardedFor
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean);

        for (let index = chain.length - 1; index >= 0; index--) {
            const candidate = chain[index];
            if (isIP(candidate) && !isTrustedProxy(candidate)) {
                return candidate;
            }
        }
    }

    const realIp = c.req.header('x-real-ip');
    if (realIp && isIP(realIp) && !isTrustedProxy(realIp)) {
        return realIp;
    }

    return peer;
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
