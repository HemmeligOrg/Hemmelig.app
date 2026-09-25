/**
 * Builds the security.txt document (RFC 9116). The document tells people
 * where to report a security issue.
 */

const DEFAULT_CONTACT = 'https://github.com/HemmeligOrg/Hemmelig.app/security/advisories/new';

// RFC 9116 recommends an Expires value less than one year in the future.
const EXPIRES_IN_MS = 364 * 24 * 60 * 60 * 1000;

/**
 * Returns the contact URIs. HEMMELIG_SECURITY_CONTACT accepts one or more
 * comma-separated values. An email address without a scheme gets `mailto:`.
 */
const getContacts = (): string[] => {
    const configured = (process.env.HEMMELIG_SECURITY_CONTACT || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => (/^[^:/\s]+@[^\s]+$/.test(value) ? `mailto:${value}` : value));

    return configured.length > 0 ? configured : [DEFAULT_CONTACT];
};

/** Returns the canonical URL of the document, or null when no base URL is set. */
const getCanonical = (): string | null => {
    const baseUrl = process.env.HEMMELIG_BASE_URL?.trim();
    if (!baseUrl) {
        return null;
    }

    try {
        return new URL('/.well-known/security.txt', baseUrl).toString();
    } catch {
        return null;
    }
};

export const buildSecurityTxt = (now: Date = new Date()): string => {
    const lines = getContacts().map((contact) => `Contact: ${contact}`);
    lines.push(`Expires: ${new Date(now.getTime() + EXPIRES_IN_MS).toISOString()}`);
    lines.push('Preferred-Languages: en');

    const canonical = getCanonical();
    if (canonical) {
        lines.push(`Canonical: ${canonical}`);
    }

    return `${lines.join('\n')}\n`;
};
