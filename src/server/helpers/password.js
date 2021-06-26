const bcrypt = require('bcrypt');

// https://www.npmjs.com/package/bcrypt
async function hash(password) {
    try {
        return await bcrypt.hash(password, 8);
    } catch (err) {
        console.error(err);
    }
}

async function compare(password, hash) {
    try {
        return await bcrypt.compare(password, hash);
    } catch (_) {
        return false;
    }
}

module.exports = {
    hash,
    compare,
};
