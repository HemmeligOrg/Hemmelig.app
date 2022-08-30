import path from 'path';
import fp from 'fastify-plugin';
import { fileTypeFromBuffer } from 'file-type';

import fileAdapter from '../services/file-adapter.js';

export default fp(async (fastify) => {
    fastify.decorate('attachment', async (req, reply) => {
        const file = await req.body.file;
        const { encryptionKey } = req.secret;

        if (file.mimetype) {
            const fileData = await file.toBuffer();

            const metadata = await fileTypeFromBuffer(fileData);

            const mime = metadata?.mime ? metadata.mime : file.mimetype.toString();
            const ext = metadata?.ext ? metadata.ext : path.extname(file.filename).replace('.', '');

            const imageData = await fileAdapter.upload(encryptionKey, fileData);

            Object.assign(req.secret, { file: { ext, mime, key: imageData.key } });
        }
    });
});
