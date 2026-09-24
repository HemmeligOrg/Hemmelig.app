import { timingSafeEqual } from 'crypto';
import { mkdir } from 'fs/promises';
import { basename, join, resolve } from 'path';
import { FILE } from './constants';
import { resolveSettings } from './settings';
import { signTokenPayload as sign, signToken, verifySignedToken } from './tokens';

/** Upload directory path */
export const UPLOAD_DIR = resolve(process.cwd(), 'uploads');

const UPLOAD_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DOWNLOAD_TOKEN_TTL_MS = 30 * 60 * 1000;

/**
 * Creates a capability token that lets the uploader attach the file to a secret.
 */
export const createUploadToken = (fileId: string, userId: string | null): string =>
    signToken(`upload:${fileId}:${userId ?? 'anonymous'}`, UPLOAD_TOKEN_TTL_MS);

/**
 * Checks an upload token against the file and the current uploader.
 */
export const verifyUploadToken = (fileId: string, userId: string | null, token: string): boolean =>
    verifySignedToken(`upload:${fileId}:${userId ?? 'anonymous'}`, token);

/**
 * Creates a short-lived capability token for downloading a file attached to a
 * secret. The token is issued only after a successful secret retrieval.
 */
export const createDownloadToken = (secretId: string, fileId: string): string => {
    const expiresAt = Date.now() + DOWNLOAD_TOKEN_TTL_MS;
    const signature = sign(`download:${secretId}:${fileId}:${expiresAt}`);
    return `${expiresAt}.${secretId}:${fileId}:${signature}`;
};

/**
 * Verifies a download token and returns the bound secret and file ids.
 */
export const verifyDownloadToken = (token: string): { secretId: string; fileId: string } | null => {
    const separator = token.indexOf('.');
    if (separator === -1) {
        return null;
    }

    const expiresAt = Number(token.slice(0, separator));
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
        return null;
    }

    const parts = token.slice(separator + 1).split(':');
    if (parts.length !== 3) {
        return null;
    }

    const [secretId, fileId, signature] = parts;
    if (!secretId || !fileId || !signature) {
        return null;
    }

    const expected = Buffer.from(sign(`download:${secretId}:${fileId}:${expiresAt}`), 'utf8');
    const provided = Buffer.from(signature, 'utf8');

    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
        return null;
    }

    return { secretId, fileId };
};

/**
 * Sanitizes a filename by removing path traversal sequences and directory separators.
 * Returns only the base filename to prevent directory escape attacks.
 */
function sanitizeFilename(filename: string): string {
    // Get only the base filename, stripping any directory components
    const base = basename(filename);
    // Remove any remaining null bytes or other dangerous characters
    return base.replace(/[\x00-\x1f]/g, '');
}

/**
 * Validates that a file path is safely within the upload directory.
 * Prevents path traversal attacks by checking the resolved absolute path.
 */
export function isPathSafe(filePath: string): boolean {
    const resolvedPath = resolve(filePath);
    return resolvedPath.startsWith(UPLOAD_DIR + '/') || resolvedPath === UPLOAD_DIR;
}

/**
 * Gets max file size from instance settings (in KB), converted to bytes.
 * Defaults to 10MB if not configured.
 */
export async function getMaxFileSize(): Promise<number> {
    const settings = await resolveSettings();
    const maxSecretSizeKB = settings?.maxSecretSize ?? FILE.DEFAULT_MAX_SIZE_KB;
    return maxSecretSizeKB * 1024; // Convert KB to bytes
}

/**
 * Ensures the upload directory exists, creating it if necessary.
 */
async function ensureUploadDir(): Promise<void> {
    try {
        await mkdir(UPLOAD_DIR, { recursive: true });
    } catch (error) {
        console.error('Failed to create upload directory:', error);
    }
}

/**
 * Generates a safe file path within the upload directory.
 * @param id - Unique identifier for the file
 * @param originalFilename - Original filename to sanitize
 * @param encryptedName - Client-encrypted filename. When set, it is stored as
 * the file name and the on-disk path uses only the id.
 * @returns Object with sanitized filename and full path, or null if invalid
 */
export function generateSafeFilePath(
    id: string,
    originalFilename: string,
    encryptedName?: string
): { filename: string; path: string } | null {
    if (encryptedName) {
        const path = join(UPLOAD_DIR, id);

        if (!isPathSafe(path)) {
            return null;
        }

        return { filename: encryptedName, path };
    }

    const safeFilename = sanitizeFilename(originalFilename);
    if (!safeFilename) {
        return null;
    }

    const filename = `${id}-${safeFilename}`;
    const path = join(UPLOAD_DIR, filename);

    // Verify path is safe
    if (!isPathSafe(path)) {
        return null;
    }

    return { filename, path };
}

// Initialize upload directory on module load
ensureUploadDir();
