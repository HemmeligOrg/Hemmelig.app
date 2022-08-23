const config = require('config');
const disk = require('./disk');
// It is using the s3 package, which means it works for s3 buckets as well
const digitalocean = require('./do');

function fileAdapter() {
    const adapter = config.get('fileAdapter');

    if (adapter === 'do') {
        return digitalocean;
    } else if (adapter === 'disk') {
        return disk;
    } else {
        return {
            upload: () => {},
            download: () => {},
            remove: () => {},
        };
    }
}

module.exports = fileAdapter();
