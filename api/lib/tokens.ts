import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Signing key for capability tokens, such as file uploads, file downloads,
 * and secret deletes. Uses the auth secret when set and a random per-process
 * fallback otherwise.
 */
const TOKEN_SECRET = process.env.BETTER_AUTH_SECRET || randomBytes(32).toString('hex');

const DELETE_TOKEN_TTL_MS = 60 * 60 * 1000;

export const signTokenPayload = (payload: string): string =>
    createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');

export const signToken = (payload: string, ttlMs: number): string => {
    const expiresAt = Date.now() + ttlMs;
    return `${expiresAt}.${signTokenPayload(`${payload}:${expiresAt}`)}`;
};

export const verifySignedToken = (payload: string, token: string): boolean => {
    const separator = token.indexOf('.');
    if (separator === -1) {
        return false;
    }

    const expiresAt = Number(token.slice(0, separator));
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
        return false;
    }

    const expected = Buffer.from(signTokenPayload(`${payload}:${expiresAt}`), 'utf8');
    const provided = Buffer.from(token.slice(separator + 1), 'utf8');

    if (expected.length !== provided.length) {
        return false;
    }

    return timingSafeEqual(expected, provided);
};

/**
 * Creates a capability token that allows deleting a secret. The token is
 * issued only after a successful reveal.
 */
export const createDeleteToken = (secretId: string): string =>
    signToken(`delete:${secretId}`, DELETE_TOKEN_TTL_MS);

/**
 * Creates a delete token for the creator of a secret. The server returns it
 * once, when it creates the secret, and it stays valid until the secret expires.
 */
export const createCreatorDeleteToken = (secretId: string, expiresAt: Date): string =>
    signToken(`delete:${secretId}`, Math.max(expiresAt.getTime() - Date.now(), 0));

/**
 * Checks a delete token against the secret id.
 */
export const verifyDeleteToken = (secretId: string, token: string): boolean =>
    verifySignedToken(`delete:${secretId}`, token);
