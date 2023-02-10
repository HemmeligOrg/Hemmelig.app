import fs from 'fs/promises';
import { nanoid } from 'nanoid';
import config from 'config';

const getFilePath = (key) => `${config.get('disk.folder')}${key}.json`;

export async function upload(fileUpload) {
    const filename = nanoid(32);

    const createFile = async () =>
        await fs.writeFile(getFilePath(filename), JSON.stringify({ encryptedFile: fileUpload }));

    try {
        await createFile();
    } catch (e) {
        console.error(e);

        await fs.mkdir(config.get('disk.folder'), { recursive: true });

        await createFile();
    }

    return {
        key: filename,
    };
}

export async function download(key) {
    try {
        const data = await fs.readFile(getFilePath(key), 'utf-8');

        const { encryptedFile } = JSON.parse(data);

        return encryptedFile;
    } catch (e) {
        console.error(e);
    }
}

export async function remove(key) {
    const data = await fs.unlink(getFilePath(key));

    return data;
}
