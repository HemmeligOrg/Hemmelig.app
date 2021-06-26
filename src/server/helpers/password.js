const crypto = require('crypto');
const config = require('config');

async function createHash(password, key) {
    return crypto
        .createHash('sha256')
        .update(config.get('secret_key') + key + password)
        .digest('hex');
}

async function compare(password, key, hash) {
    const newHash = await createHash(password, key);

    return newHash === hash;
}

module.exports = {
    createHash,
    compare,
};
