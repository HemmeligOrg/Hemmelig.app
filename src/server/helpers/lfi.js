const config = require('config');
const sanitize = require('sanitize-filename');

// Prevent some bad LFI
function isLFIAttempt(file) {
    const filePath = sanitize(file);

    if (!filePath.startsWith(config.get('disk.folder'))) {
        return true;
    }

    return false;
}

module.exports = isLFIAttempt;
