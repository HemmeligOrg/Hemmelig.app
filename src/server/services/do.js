import { Upload } from '@aws-sdk/lib-storage';
import { S3 } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';
import config from 'config';

function createConfig() {
    if (config.get('aws.s3.region')) {
        return {
            endpoint: `https://s3.${config.get('aws.s3.region')}.amazonaws.com/`,
            region: config.get('aws.s3.region'),
            credentials: {
                accessKeyId: config.get('aws.s3.key'),
                secretAccessKey: config.get('aws.s3.secret'),
            },
        };
    }

    return {
        endpoint: config.get('do.spaces.endpoint'),
        region: 'hemmelig',
        credentials: {
            accessKeyId: config.get('do.spaces.key'),
            secretAccessKey: config.get('do.spaces.secret'),
        },
    };
}

const bucket = config.get('aws.s3.bucket') ?? config.get('do.spaces.bucket');
const folder = config.get('aws.s3.folder') ?? config.get('do.spaces.folder');

const s3 = new S3(createConfig());

export async function upload(fileUpload) {
    const filename = nanoid(32);

    try {
        await new Upload({
            client: s3,
            params: {
                Bucket: bucket,
                Key: `${folder}/${filename}.json`,
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
            Bucket: bucket,
            Key: `${folder}/${key}.json`,
        });

        const json = await data.Body.transformToString();

        const { encryptedFile } = JSON.parse(json);

        return encryptedFile;
    } catch (e) {
        console.error(e);
    }
}

export async function remove(key) {
    const data = await s3.deleteObject({
        Bucket: bucket,
        Key: `${folder}/${key}.json`,
    });

    return data;
}
