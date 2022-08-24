const AWS = require('aws-sdk');
const { nanoid } = require('nanoid');
const config = require('config');

const { encrypt, decrypt } = require('../helpers/crypto');

// Set the Region
AWS.config.update({
    region: 'hemmelig',
    accessKeyId: config.get('do.spaces.key'),
    secretAccessKey: config.get('do.spaces.secret'),
});

const s3 = new AWS.S3({
    endpoint: new AWS.Endpoint(config.get('do.spaces.endpoint')),
});

async function upload(encryptionKey, fileUpload) {
    const filename = nanoid();

    const encryptedFile = encrypt(fileUpload.toString('hex'), encryptionKey);

    const data = await s3
        .upload({
            Bucket: config.get('do.spaces.bucket'),
            Key: `${config.get('do.spaces.folder')}/${filename}.json`,
            Body: JSON.stringify({ encryptedFile }),
        })
        .promise();

    return {
        key: filename,
    };
}

async function download(key, encryptionKey) {
    try {
        const data = await s3
            .getObject({
                Bucket: config.get('do.spaces.bucket'),
                Key: `${config.get('do.spaces.folder')}/${key}.json`,
            })
            .promise();

        const { encryptedFile } = JSON.parse(data.Body);

        const file = decrypt(encryptedFile, encryptionKey);

        return Buffer.from(file, 'hex');
    } catch (e) {
        console.error(e);
    }
}

async function remove(key) {
    const data = await s3
        .deleteObject({
            Bucket: config.get('do.spaces.bucket'),
            Key: `${config.get('do.spaces.folder')}/${key}.json`,
        })
        .promise();

    return data;
}

module.exports = {
    upload,
    download,
    remove,
};
