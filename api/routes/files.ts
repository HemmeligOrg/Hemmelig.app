import { zValidator } from '@hono/zod-validator';
import { createReadStream, createWriteStream } from 'fs';
import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { nanoid } from 'nanoid';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { auth } from '../auth';
import prisma from '../lib/db';
import {
    createUploadToken,
    generateSafeFilePath,
    getMaxFileSize,
    isPathSafe,
    verifyDownloadToken,
} from '../lib/files';
import { resolveSettings } from '../lib/settings';
import { authMiddleware } from '../middlewares/auth';
import { enforceBodyLimit } from '../middlewares/body-limit';
import { idParamSchema } from '../validations/shared';

const files = new Hono<{
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
    };
}>();

files.get('/:id', zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const token = c.req.header('x-hemmelig-file-token');

    // Files are only downloadable with a capability issued by a successful
    // secret retrieval.
    if (!token) {
        return c.json({ error: 'File not found' }, 404);
    }

    const decoded = verifyDownloadToken(token);
    if (!decoded || decoded.fileId !== id) {
        return c.json({ error: 'File not found' }, 404);
    }

    try {
        // Verify the file is still attached to the secret that issued the token.
        const file = await prisma.file.findUnique({
            where: { id },
            include: {
                secrets: {
                    where: { id: decoded.secretId, expiresAt: { gt: new Date() } },
                    select: { id: true },
                },
            },
        });

        if (!file || file.secrets.length === 0) {
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

files.post(
    '/',
    authMiddleware,
    async (c, next) => {
        // Bound the multipart body before parsing it.
        const maxFileSize = await getMaxFileSize();

        return enforceBodyLimit(maxFileSize + 64 * 1024)(c, next);
    },
    async (c) => {
        try {
            // Check if file uploads are allowed
            const instanceSettings = await resolveSettings();
            const allowFileUploads = instanceSettings?.allowFileUploads ?? true;

            if (!allowFileUploads) {
                return c.json({ error: 'File uploads are disabled on this instance.' }, 403);
            }

            const body = await c.req.parseBody();
            const file = body['file'];

            if (!(file instanceof File)) {
                return c.json({ error: 'File is required and must be a file.' }, 400);
            }

            const maxFileSize = await getMaxFileSize();
            if (file.size > maxFileSize) {
                return c.json(
                    { error: `File size exceeds the limit of ${maxFileSize / 1024 / 1024}MB.` },
                    413
                );
            }

            const id = nanoid();

            // Clients encrypt file names. Legacy clients send no name and keep
            // the original plaintext name.
            const encryptedNameRaw = body['name'];
            let encryptedName: string | undefined;

            if (encryptedNameRaw !== undefined) {
                if (
                    typeof encryptedNameRaw !== 'string' ||
                    encryptedNameRaw.length === 0 ||
                    encryptedNameRaw.length > 1024 ||
                    !/^[a-f0-9]+$/i.test(encryptedNameRaw)
                ) {
                    return c.json({ error: 'Invalid encrypted filename' }, 400);
                }

                encryptedName = encryptedNameRaw;
            }

            const safePath = generateSafeFilePath(id, file.name, encryptedName);

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

            const user = c.get('user');

            return c.json(
                {
                    id: newFile.id,
                    token: createUploadToken(newFile.id, user?.id ?? null),
                },
                201
            );
        } catch (error) {
            console.error('Failed to upload file:', error);
            return c.json({ error: 'Failed to upload file' }, 500);
        }
    }
);

export default files;
