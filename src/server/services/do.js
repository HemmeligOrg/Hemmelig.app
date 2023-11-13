import AWS from 'aws-sdk';
import { Upload } from '@aws-sdk/lib-storage';
import { S3 } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';
import config from 'config';

// Set the Region
// JS SDK v3 does not support global configuration.
// Codemod has attempted to pass values to each service client in this file.
// You may need to update clients outside of this file, if they use global config.
AWS.config.update({
    region: 'hemmelig',
    accessKeyId: config.get('do.spaces.key'),
    secretAccessKey: config.get('do.spaces.secret'),
});

const s3 = new S3({
    // The transformation for endpoint is not implemented.
    // Refer to UPGRADING.md on aws-sdk-js-v3 for changes needed.
    // Please create/upvote feature request on aws-sdk-js-codemod for endpoint.
    endpoint: new AWS.Endpoint(config.get('do.spaces.endpoint')),

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
