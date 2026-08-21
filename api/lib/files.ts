import { mkdir, unlink } from 'fs/promises';
import { basename, join, resolve } from 'path';
import { FILE } from './constants';
import { resolveSettings } from './settings';

/** Upload directory path */
export const UPLOAD_DIR = resolve(process.cwd(), 'uploads');

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
 * Unlinks files from disk, logging (not throwing) on individual failures —
 * a file may already be gone or inaccessible. Returns the paths that were
 * actually removed so callers only drop DB records for confirmed deletions.
 */
export async function unlinkFiles(paths: string[]): Promise<string[]> {
    const results = await Promise.allSettled(paths.map((path) => unlink(path)));
    const deleted: string[] = [];
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(`Failed to delete file from disk: ${paths[index]}`, result.reason);
        } else {
            deleted.push(paths[index]);
        }
    });
    return deleted;
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
 * @returns Object with sanitized filename and full path, or null if invalid
 */
export function generateSafeFilePath(
    id: string,
    originalFilename: string
): { filename: string; path: string } | null {
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
