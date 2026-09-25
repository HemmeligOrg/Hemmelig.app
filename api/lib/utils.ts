import dns from 'dns/promises';
import { type Context } from 'hono';
import ipRangeCheck from 'ip-range-check';
import { isIP } from 'is-ip';
import { isIP as nodeIsIP } from 'node:net';
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

// CIDR ranges that must never be reachable from server-side requests.
// IPv6 ranges that embed an IPv4 address are blocked as a whole, because
// the embedded address can point to an internal host.
const blockedIpRanges = [
    '0.0.0.0/8',
    '10.0.0.0/8',
    '100.64.0.0/10',
    '127.0.0.0/8',
    '169.254.0.0/16',
    '172.16.0.0/12',
    '192.0.0.0/24',
    '192.0.2.0/24',
    '192.168.0.0/16',
    '198.18.0.0/15',
    '198.51.100.0/24',
    '203.0.113.0/24',
    '224.0.0.0/4',
    '240.0.0.0/4',
    '255.255.255.255/32',
    // IPv4-compatible (deprecated). Includes :: and ::1.
    '::/96',
    '::ffff:0:0/96',
    // NAT64, well-known and local-use prefixes.
    '64:ff9b::/96',
    '64:ff9b:1::/48',
    '100::/64',
    // Teredo, which embeds an IPv4 address.
    '2001::/32',
    // Documentation.
    '2001:db8::/32',
    '3fff::/20',
    // 6to4, which embeds an IPv4 address.
    '2002::/16',
    'fc00::/7',
    'fe80::/10',
    'ff00::/8',
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
 * Check if an IP address is public and routable.
 * @param ip IP address to check
 * @returns true if the address is public
 */
export const isPublicIpAddress = (ip: string): boolean => {
    const address = normalizeIpAddress(ip);

    // Fail closed: an address that does not parse is never public.
    if (!address) {
        return false;
    }

    return !blockedIpRanges.some((range) => ipRangeCheck(address, range));
};

/**
 * Returns the canonical form of an IP address, or null when the value is not one.
 * IPv6 addresses go through the URL parser, so that forms such as
 * `::127.0.0.1` become `::7f00:1` before the range check.
 */
const normalizeIpAddress = (ip: string): string | null => {
    const bare = ip.trim().replace(/^\[|\]$/g, '');
    const version = nodeIsIP(bare);

    if (version === 4) {
        return bare;
    }

    if (version === 6) {
        try {
            return new URL(`http://[${bare}]/`).hostname.replace(/^\[|\]$/g, '');
        } catch {
            return null;
        }
    }

    return null;
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

        // Webhook delivery supports only HTTP and HTTPS.
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return false;
        }

        const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

        // Block special domain patterns (e.g., .local, .localhost)
        if (blockedHostnamePatterns.some((pattern) => pattern.test(hostname))) {
            return false;
        }

        // If hostname is already an IP address, check it directly
        if (isIP(hostname)) {
            return isPublicIpAddress(hostname);
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
        return addresses.every((ip) => isPublicIpAddress(ip));
    } catch {
        return false;
    }
};
