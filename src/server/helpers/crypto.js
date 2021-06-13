const crypto = require('crypto');
const config = require('config');

const ALGORITHM = 'aes-256-ctr';
const SECRET_KEY = config.get('secret_key');

// Change algorithm? https://stackoverflow.com/questions/1220751/how-to-choose-an-aes-encryption-mode-cbc-ecb-ctr-ocb-cfb

function encrypt(text) {
    const IV = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, IV);

    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
        iv: IV.toString('hex'),
        content: encrypted.toString('hex'),
    };
}

function decrypt(hash) {
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(hash.iv, 'hex'));

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
