const crypto = require('crypto');
const config = require('config');

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = config.get('secret_key');

function encrypt(text, userEncryptionKey) {
    const iv = crypto.randomBytes(16);

    const salt = crypto.randomBytes(64);

    const MASTER_KEY = crypto
        .createHash('sha256')
        .update(SECRET_KEY + userEncryptionKey)
        .digest('hex');

    const key = crypto.pbkdf2Sync(MASTER_KEY, salt, 2145, 32, 'sha512');

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

    const tag = cipher.getAuthTag();

    return Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
}

function decrypt(encryptedData, userEncryptionKey) {
    const data = Buffer.from(encryptedData, 'hex');

    const MASTER_KEY = crypto
        .createHash('sha256')
        .update(SECRET_KEY + userEncryptionKey)
        .digest('hex');

    const salt = data.slice(0, 64);
    const iv = data.slice(64, 80);
    const tag = data.slice(80, 96);
    const text = data.slice(96);

    const key = crypto.pbkdf2Sync(MASTER_KEY, salt, 2145, 32, 'sha512');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(Buffer.from(text, 'hex')), decipher.final()]);

    return decrypted;
}

module.exports = {
    encrypt,
    decrypt,
};
