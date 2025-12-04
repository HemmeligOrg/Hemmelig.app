import { zValidator } from '@hono/zod-validator';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { basename, join, resolve } from 'path';
import { z } from 'zod';
import instanceSettings from '../instance-settings';
import prisma from '../lib/db';

const files = new Hono();

const UPLOAD_DIR = resolve(process.cwd(), 'uploads');

/**
 * Sanitizes a filename by removing path traversal sequences and directory separators.
 * Returns only the base filename to prevent directory escape attacks.
 */
const sanitizeFilename = (filename: string): string => {
    // Get only the base filename, stripping any directory components
    const base = basename(filename);
    // Remove any remaining null bytes or other dangerous characters
    return base.replace(/[\x00-\x1f]/g, '');
};

/**
 * Validates that a file path is safely within the upload directory.
 * Prevents path traversal attacks by checking the resolved absolute path.
 */
const isPathSafe = (filePath: string): boolean => {
    const resolvedPath = resolve(filePath);
    return resolvedPath.startsWith(UPLOAD_DIR + '/') || resolvedPath === UPLOAD_DIR;
};

// Get max file size from instance settings (in KB), convert to bytes
// Default to 10MB (10240 KB) if not set
const getMaxFileSize = (): number => {
    const settings = instanceSettings.get('instanceSettings');
    const maxSecretSizeKB = settings?.maxSecretSize ?? 10240;
    return maxSecretSizeKB * 1024; // Convert KB to bytes
};

const fileIdParamSchema = z.object({
    id: z.string(),
});

const ensureUploadDir = async () => {
    try {
        await mkdir(UPLOAD_DIR, { recursive: true });
    } catch (error) {
        console.error('Failed to create upload directory:', error);
    }
};
ensureUploadDir();

files.get('/:id', zValidator('param', fileIdParamSchema), async (c) => {
    const { id } = c.req.valid('param');

    try {
        const file = await prisma.file.findUnique({
            where: { id },
        });

        if (!file) {
            return c.json({ error: 'File not found' }, 404);
        }

        // Validate path is within upload directory to prevent path traversal
        if (!isPathSafe(file.path)) {
            console.error(`Path traversal attempt detected: ${file.path}`);
            return c.json({ error: 'File not found' }, 404);
        }

        const fileBuffer = await readFile(file.path);
        return c.body(fileBuffer);
    } catch (error) {
        console.error('Failed to download file:', error);
        return c.json({ error: 'Failed to download file' }, 500);
    }
});

files.post('/', async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body['file'];

        if (!(file instanceof File)) {
            return c.json({ error: 'File is required and must be a file.' }, 400);
        }

        const maxFileSize = getMaxFileSize();
        if (file.size > maxFileSize) {
            return c.json(
                { error: `File size exceeds the limit of ${maxFileSize / 1024 / 1024}MB.` },
                413
            );
        }

        const id = nanoid();
        // Sanitize filename to prevent path traversal attacks
        const safeFilename = sanitizeFilename(file.name);
        if (!safeFilename) {
            return c.json({ error: 'Invalid filename' }, 400);
        }
        const filename = `${id}-${safeFilename}`;
        const path = join(UPLOAD_DIR, filename);

        // Double-check the resolved path is within upload directory
        if (!isPathSafe(path)) {
            console.error(`Path traversal attempt in upload: ${file.name}`);
            return c.json({ error: 'Invalid filename' }, 400);
        }

        await writeFile(path, Buffer.from(await file.arrayBuffer()));

        const newFile = await prisma.file.create({
            data: { id, filename, path },
        });

        return c.json({ id: newFile.id }, 201);
    } catch (error) {
        console.error('Failed to upload file:', error);
        return c.json({ error: 'Failed to upload file' }, 500);
    }
});

export default files;
