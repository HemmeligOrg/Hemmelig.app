import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';
import config from 'config';

// Set the Region
AWS.config.update({
    region: 'hemmelig',
    accessKeyId: config.get('do.spaces.key'),
    secretAccessKey: config.get('do.spaces.secret'),
});

const s3 = new AWS.S3({
    endpoint: new AWS.Endpoint(config.get('do.spaces.endpoint')),
});

export async function upload(fileUpload) {
    const filename = nanoid(32);

    try {
        await s3
            .upload({
                Bucket: config.get('do.spaces.bucket'),
                Key: `${config.get('do.spaces.folder')}/${filename}.json`,
                Body: JSON.stringify({ encryptedFile: fileUpload }),
            })
            .promise();

        return {
            key: filename,
        };
    } catch (e) {
        console.error(e);
    }
}

export async function download(key) {
    try {
        const data = await s3
            .getObject({
                Bucket: config.get('do.spaces.bucket'),
                Key: `${config.get('do.spaces.folder')}/${key}.json`,
            })
            .promise();

        const { encryptedFile } = JSON.parse(data.Body);

        return encryptedFile;
    } catch (e) {
        console.error(e);
    }
}

export async function remove(key) {
    const data = await s3
        .deleteObject({
            Bucket: config.get('do.spaces.bucket'),
            Key: `${config.get('do.spaces.folder')}/${key}.json`,
        })
        .promise();

    return data;
}
