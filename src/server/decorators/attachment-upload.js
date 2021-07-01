const fp = require('fastify-plugin');
const FileType = require('file-type');
const MAX_FILE_BYTES = 1024 * 16 * 1000; // 16mb - 16 024 000 bytes
const { upload } = require('../services/do');

module.exports = fp(async (fastify) => {
    fastify.decorate('attachment', async (req, reply) => {
        const file = await req.body.file;
        const { encryptionKey } = req.secret;

        // First release it will be images only. Have to look into how
        // to solve this for the ext, and mime types for other files.
        if (file.filename && file.mimetype.startsWith('image/')) {
            try {
                await req.jwtVerify();
            } catch (err) {
                return reply.send({
                    error: 'You have to create an account and sign in to upload images',
                });
            }

            const fileData = await file.toBuffer();
            const byteLength = Buffer.byteLength(fileData);

            if (byteLength > MAX_FILE_BYTES) {
                return reply.code(413).send({
                    error: `The file size (${prettyBytes(
                        byteLength
                    )}) exceeded our limit of ${prettyBytes(MAX_FILE_BYTES)}.`,
                });
            }

            const imageData = await upload(encryptionKey, fileData);

            const { ext, mime } = await FileType.fromBuffer(fileData);

            Object.assign(req.secret, { file: { ext, mime, key: imageData.key } });
        }

        if (file.filename && !file.mimetype.startsWith('image/')) {
            return reply.code(415).send({
                error: `This file type "${file.mimetype}" is not supported, yet.`,
            });
        }
    });
});
