const fs = require('fs').promises;
const { nanoid } = require('nanoid');
const config = require('config');

const { encrypt, decrypt } = require('../helpers/crypto');
const isLFIAttempt = require('../helpers/lfi');

async function upload(encryptionKey, fileUpload) {
    const filename = nanoid();

    const encryptedFile = encrypt(fileUpload.toString('hex'), encryptionKey);

    const path = `${config.get('disk.folder')}${filename}.json`;

    try {
        await fs.mkdir(config.get('disk.folder'), { recursive: true });
        await fs.writeFile(path, JSON.stringify({ encryptedFile }));
    } catch (e) {
        console.error(e);
    }

    return {
        key: path,
    };
}

async function download(key, encryptionKey) {
    if (isLFIAttempt(key)) {
        return 'LFI attempt';
    }

    try {
        const data = await fs.readFile(key, 'utf-8');

        const { encryptedFile } = JSON.parse(data);

        const file = decrypt(encryptedFile, encryptionKey);

        return Buffer.from(file, 'hex');
    } catch (e) {
        console.error(e);
    }
}

async function remove(key) {
    if (isLFIAttempt(key)) {
        return 'LFI attempt';
    }

    const data = await fs.unlink(key);

    return data;
}

module.exports = {
    upload,
    download,
    remove,
};
