import { zValidator } from '@hono/zod-validator';
import { createReadStream, createWriteStream } from 'fs';
import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { nanoid } from 'nanoid';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { z } from 'zod';
import prisma from '../lib/db';
import { generateSafeFilePath, getMaxFileSize, isPathSafe } from '../lib/files';

const files = new Hono();

const fileIdParamSchema = z.object({
    id: z.string(),
});

files.get('/:id', zValidator('param', fileIdParamSchema), async (c) => {
    const { id } = c.req.valid('param');

    try {
        // Fetch file with its associated secrets to verify access
        const file = await prisma.file.findUnique({
            where: { id },
            include: {
                secrets: {
                    select: {
                        id: true,
                        views: true,
                        expiresAt: true,
                    },
                },
            },
        });

        if (!file) {
            return c.json({ error: 'File not found' }, 404);
        }

        // Security: Verify the file is associated with at least one valid (non-expired, has views) secret
        // This prevents direct file access without going through the secret viewing flow
        const hasValidSecret = file.secrets.some((secret) => {
            const now = new Date();
            const hasViewsRemaining = secret.views === null || secret.views >= 0;
            const notExpired = secret.expiresAt > now;
            return hasViewsRemaining && notExpired;
        });

        if (!hasValidSecret) {
            return c.json({ error: 'File not found' }, 404);
        }

        // Validate path is within upload directory to prevent path traversal
        if (!isPathSafe(file.path)) {
            console.error(`Path traversal attempt detected: ${file.path}`);
            return c.json({ error: 'File not found' }, 404);
        }

        // Stream the file instead of loading it entirely into memory
        const nodeStream = createReadStream(file.path);
        const webStream = Readable.toWeb(nodeStream) as ReadableStream;

        return stream(c, async (s) => {
            s.onAbort(() => {
                nodeStream.destroy();
            });
            await s.pipe(webStream);
        });
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
        const safePath = generateSafeFilePath(id, file.name);

        if (!safePath) {
            console.error(`Path traversal attempt in upload: ${file.name}`);
            return c.json({ error: 'Invalid filename' }, 400);
        }

        // Stream the file to disk instead of loading it entirely into memory
        const webStream = file.stream();
        const nodeStream = Readable.fromWeb(webStream as import('stream/web').ReadableStream);
        const writeStream = createWriteStream(safePath.path);

        await pipeline(nodeStream, writeStream);

        const newFile = await prisma.file.create({
            data: { id, filename: safePath.filename, path: safePath.path },
        });

        return c.json({ id: newFile.id }, 201);
    } catch (error) {
        console.error('Failed to upload file:', error);
        return c.json({ error: 'Failed to upload file' }, 500);
    }
});

export default files;
