const crypto = require('crypto');
const config = require('config');

const ALGORITHM = 'aes-256-ctr';
const SECRET_KEY = config.get('secret_key');

// Change algorithm? https://stackoverflow.com/questions/1220751/how-to-choose-an-aes-encryption-mode-cbc-ecb-ctr-ocb-cfb

function encrypt(text, key) {
    const IV = crypto.randomBytes(16);

    // We need a 32 length key for the cipher
    const MASTER_KEY = crypto
        .createHash('md5')
        .update(SECRET_KEY + key)
        .digest('hex');

    const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, IV);

    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
        iv: IV.toString('hex'),
        content: encrypted.toString('hex'),
    };
}

function decrypt(hash, key) {
    // We need a 32 length key for the cipher
    const MASTER_KEY = crypto
        .createHash('md5')
        .update(SECRET_KEY + key)
        .digest('hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, Buffer.from(hash.iv, 'hex'));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(hash.content, 'hex')),
        decipher.final(),
    ]);

    return decrypted.toString();
}

module.exports = {
    encrypt,
    decrypt,
};
