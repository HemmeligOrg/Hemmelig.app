const fp = require('fastify-plugin');
const FileType = require('file-type');

const { upload } = require('../services/file-adapter');

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
const notAllowed = [
    'application/zip',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/vnd.rar',
    'application/ogg',
    'application/java-archive',
    'application/gzip',
    'application/x-bzip2',
    'application/x-bzip',
    'application/x-cdf',
    'application/x-freearc',
];

function acceptedFileType(mimetype) {
    if (notAllowed.indexOf(mimetype) > -1) {
        return false;
    }

    if (mimetype.startsWith('image/')) {
        return true;
    }

    if (mimetype.startsWith('application/')) {
        return true;
    }

    if (mimetype.startsWith('text/')) {
        return true;
    }

    return false;
}

module.exports = fp(async (fastify) => {
    fastify.decorate('attachment', async (req, reply) => {
        const file = await req.body.file;
        const { encryptionKey } = req.secret;

        if (file.mimetype) {
            const fileData = await file.toBuffer();

            const { ext, mime } = await FileType.fromBuffer(fileData);

            if (!acceptedFileType(mime)) {
                return reply.code(415).send({
                    error: `This file type "${mime}" is not supported, yet.`,
                });
            }

            const imageData = await upload(encryptionKey, fileData);

            Object.assign(req.secret, { file: { ext, mime, key: imageData.key } });
        }
    });
});
