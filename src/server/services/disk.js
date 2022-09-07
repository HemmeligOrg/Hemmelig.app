import fs from 'fs/promises';
import { nanoid } from 'nanoid';
import config from 'config';

import { encrypt, decrypt } from '../../shared/helpers/crypto.js';

const getFilePath = (key) => `${config.get('disk.folder')}${key}.json`;

export async function upload(encryptionKey, fileUpload) {
    const filename = nanoid();

    const encryptedFile = encrypt(fileUpload.toString('hex'), encryptionKey);

    try {
        await fs.mkdir(config.get('disk.folder'), { recursive: true });
        await fs.writeFile(getFilePath(filename), JSON.stringify({ encryptedFile }));
    } catch (e) {
        console.error(e);
    }

    return {
        key: filename,
    };
}

export async function download(key, encryptionKey) {
    try {
        const data = await fs.readFile(getFilePath(key), 'utf-8');

        const { encryptedFile } = JSON.parse(data);

        const file = decrypt(encryptedFile, encryptionKey);

        return Buffer.from(file, 'hex');
    } catch (e) {
        console.error(e);
    }
}

export async function remove(key) {
    const data = await fs.unlink(getFilePath(key));

    return data;
}
