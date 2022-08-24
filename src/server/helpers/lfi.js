const config = require('config');

// Prevent some bad LFI
function isLFIAttempt(file) {
    if (!file.startsWith(config.get('disk.folder')) || file.includes('..')) {
        return true;
    }

    return false;
}

module.exports = isLFIAttempt;
