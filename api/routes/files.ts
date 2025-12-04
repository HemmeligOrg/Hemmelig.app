import { zValidator } from '@hono/zod-validator';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { join } from 'path';
import { z } from 'zod';
import instanceSettings from '../instance-settings';
import prisma from '../lib/db';

const files = new Hono();

const UPLOAD_DIR = join(process.cwd(), 'uploads');

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
        const filename = `${id}-${file.name}`;
        const path = join(UPLOAD_DIR, filename);

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
