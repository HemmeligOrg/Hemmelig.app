import path from 'path';
import fp from 'fastify-plugin';
import { fileTypeFromBuffer } from 'file-type';

import fileAdapter from '../services/file-adapter.js';

export default fp(async (fastify) => {
    fastify.decorate('attachment', async (req, reply) => {
        const reqFiles = await req.body['files[]'];
        const { encryptionKey } = req.secret;

        const files = (reqFiles?.length ? reqFiles : [reqFiles]).filter(Boolean);

        if (files?.length) {
            req.secret.files = [];

            // yeah, for loop, I know. Could easily be reduce or what not
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                const fileData = await file.toBuffer();

                const metadata = await fileTypeFromBuffer(fileData);

                const mime = metadata?.mime ? metadata.mime : file.mimetype.toString();
                const ext = metadata?.ext
                    ? metadata.ext
                    : path.extname(file.filename).replace('.', '');

                const imageData = await fileAdapter.upload(encryptionKey, fileData);

                req.secret.files.push({ ext, mime, key: imageData.key });
            }
        }
    });
});
