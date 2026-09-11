import { createHash, timingSafeEqual } from 'crypto';

/**
 * Database sentinel ID of the single-use initial setup claim (Verification row).
 * Shared between the setup route (writer/owner) and the auth hooks (validator).
 */
export const SETUP_CLAIM_ID = 'initial-setup-claim';

/**
 * Time-to-live of the initial setup claim in milliseconds. A claim held longer
 * than this is considered abandoned and can be reclaimed by a new setup attempt.
 */
export const SETUP_CLAIM_TTL_MS = 60_000;

/**
 * Hashes a raw setup claim token for storage in the database (CWE-312). Only the
 * SHA-256 digest is ever persisted or compared; the raw token stays in-process.
 *
 * @param claimToken - The raw single-use setup claim token.
 * @returns The hex-encoded SHA-256 digest of the token.
 */
export function hashSetupClaimToken(claimToken: string): string {
    return createHash('sha256').update(claimToken, 'utf8').digest('hex');
}

/**
 * Compares two secret strings in constant time to prevent timing attacks (CWE-208).
 * Both strings are UTF-8 encoded before the length check, so mismatched byte
 * lengths (including multibyte untrusted input) return false instead of
 * throwing a RangeError from `timingSafeEqual` (CWE-208 / CWE-476 hardening).
 * A byte-length mismatch itself leaks only the encoded length, which is
 * acceptable for fixed-length secrets such as hex-encoded SHA-256 digests.
 *
 * @param a - First secret string.
 * @param b - Second secret string.
 * @returns True when both strings are byte-for-byte equal.
 */
export function safeSecretEqual(a: string, b: string): boolean {
    const bufferA: Buffer = Buffer.from(a, 'utf8');
    const bufferB: Buffer = Buffer.from(b, 'utf8');
    if (bufferA.length !== bufferB.length) {
        return false;
    }
    return timingSafeEqual(bufferA, bufferB);
}
