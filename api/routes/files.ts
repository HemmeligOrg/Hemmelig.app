import { zValidator } from '@hono/zod-validator';
import { createReadStream, createWriteStream } from 'fs';
import { type Context, Hono } from 'hono';
import { stream } from 'hono/streaming';
import { nanoid } from 'nanoid';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { auth } from '../auth';
import prisma from '../lib/db';
import {
    createUploadToken,
    generateSafeFilePath,
    getMaxFileSize,
    isPathSafe,
    isValidEncryptedName,
    removeStoredFile,
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

/** Raw uploads send the encrypted file name in this header. */
const FILE_NAME_HEADER = 'x-hemmelig-file-name';

class UploadTooLargeError extends Error {}

/**
 * Returns a stream step that counts bytes and fails when the total passes the limit.
 */
const limitBytes = (maxBytes: number) => {
    let total = 0;
    return new Transform({
        transform(chunk: Buffer, _encoding, callback) {
            total += chunk.length;
            if (total > maxBytes) {
                callback(new UploadTooLargeError());
                return;
            }
            callback(null, chunk);
        },
    });
};

/** Stores the file record and returns the upload capability for the client. */
const saveFileRecord = async (
    c: Context,
    userId: string | null,
    id: string,
    safePath: { filename: string; path: string }
) => {
    const newFile = await prisma.file.create({
        data: { id, filename: safePath.filename, path: safePath.path },
    });

    return c.json(
        {
            id: newFile.id,
            token: createUploadToken(newFile.id, userId),
        },
        201
    );
};

/**
 * Streams a raw `application/octet-stream` body to disk. The server never
 * holds the whole file in memory. The encrypted file name comes in the
 * `X-Hemmelig-File-Name` header.
 */
const uploadRawFile = async (c: Context, userId: string | null, maxFileSize: number) => {
    const contentLength = c.req.header('content-length');

    // A known length lets the server reject a large file before it reads it,
    // and lets the body limits apply without buffering.
    if (contentLength === undefined) {
        return c.json({ error: 'Content-Length is required for raw uploads.' }, 411);
    }

    const size = Number(contentLength);
    if (!Number.isInteger(size) || size <= 0) {
        return c.json({ error: 'File is required and must be a file.' }, 400);
    }

    if (size > maxFileSize) {
        return c.json(
            { error: `File size exceeds the limit of ${maxFileSize / 1024 / 1024}MB.` },
            413
        );
    }

    const encryptedName = c.req.header(FILE_NAME_HEADER);
    if (!isValidEncryptedName(encryptedName)) {
        return c.json({ error: 'Invalid encrypted filename' }, 400);
    }

    const body = c.req.raw.body;
    if (!body) {
        return c.json({ error: 'File is required and must be a file.' }, 400);
    }

    const id = nanoid();
    const safePath = generateSafeFilePath(id, '', encryptedName);
    if (!safePath) {
        return c.json({ error: 'Invalid filename' }, 400);
    }

    try {
        await pipeline(
            Readable.fromWeb(body as import('stream/web').ReadableStream),
            limitBytes(maxFileSize),
            createWriteStream(safePath.path)
        );
    } catch (error) {
        await removeStoredFile(safePath.path);

        if (error instanceof UploadTooLargeError) {
            return c.json(
                { error: `File size exceeds the limit of ${maxFileSize / 1024 / 1024}MB.` },
                413
            );
        }

        throw error;
    }

    return saveFileRecord(c, userId, id, safePath);
};

/**
 * Parses a multipart form with the fields `file` and `name`. The form parser
 * holds the whole file in memory, so large files should use a raw upload.
 */
const uploadMultipartFile = async (c: Context, userId: string | null, maxFileSize: number) => {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!(file instanceof File)) {
        return c.json({ error: 'File is required and must be a file.' }, 400);
    }

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
        if (!isValidEncryptedName(encryptedNameRaw)) {
            return c.json({ error: 'Invalid encrypted filename' }, 400);
        }

        encryptedName = encryptedNameRaw;
    }

    const safePath = generateSafeFilePath(id, file.name, encryptedName);

    if (!safePath) {
        console.error(`Path traversal attempt in upload: ${file.name}`);
        return c.json({ error: 'Invalid filename' }, 400);
    }

    // Stream the parsed file to disk
    const webStream = file.stream();
    const nodeStream = Readable.fromWeb(webStream as import('stream/web').ReadableStream);
    const writeStream = createWriteStream(safePath.path);

    await pipeline(nodeStream, writeStream);

    return saveFileRecord(c, userId, id, safePath);
};

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

            const maxFileSize = await getMaxFileSize();
            const userId = c.get('user')?.id ?? null;
            const contentType = c.req.header('content-type') ?? '';

            if (contentType.toLowerCase().startsWith('application/octet-stream')) {
                return await uploadRawFile(c, userId, maxFileSize);
            }

            return await uploadMultipartFile(c, userId, maxFileSize);
        } catch (error) {
            console.error('Failed to upload file:', error);
            return c.json({ error: 'Failed to upload file' }, 500);
        }
    }
);

export default files;
