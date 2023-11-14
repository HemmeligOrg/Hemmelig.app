import { Upload } from '@aws-sdk/lib-storage';
import { S3 } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';
import config from 'config';

const s3 = new S3({
    endpoint: config.get('do.spaces.endpoint'),
    region: 'hemmelig',
    credentials: {
        accessKeyId: config.get('do.spaces.key'),
        secretAccessKey: config.get('do.spaces.secret'),
    },
});

export async function upload(fileUpload) {
    const filename = nanoid(32);

    try {
        await new Upload({
            client: s3,
            params: {
                Bucket: config.get('do.spaces.bucket'),
                Key: `${config.get('do.spaces.folder')}/${filename}.json`,
                Body: JSON.stringify({ encryptedFile: fileUpload }),
            },
        }).done();

        return {
            key: filename,
        };
    } catch (e) {
        console.error(e);
    }
}

export async function download(key) {
    try {
        const data = await s3.getObject({
            Bucket: config.get('do.spaces.bucket'),
            Key: `${config.get('do.spaces.folder')}/${key}.json`,
        });

        const { encryptedFile } = JSON.parse(data.Body);

        return encryptedFile;
    } catch (e) {
        console.error(e);
    }
}

export async function remove(key) {
    const data = await s3.deleteObject({
        Bucket: config.get('do.spaces.bucket'),
        Key: `${config.get('do.spaces.folder')}/${key}.json`,
    });

    return data;
}
