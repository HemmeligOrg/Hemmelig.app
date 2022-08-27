import config from 'config';
import * as disk from './disk.js';
// It is using the s3 package, which means it works for s3 buckets as well
import * as digitalocean from './do.js';

function fileAdapter() {
    const adapter = config.get('file.adapter');

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

const adapter = fileAdapter();

export default adapter;
