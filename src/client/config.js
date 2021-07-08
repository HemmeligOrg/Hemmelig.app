import merge from 'deepmerge';
import delve from 'dlv';
import defaultConfig from './config/default';

let SERVER_CONFIG;

if (typeof window !== 'undefined') {
    SERVER_CONFIG = window.__SECRET_CONFIG === '' ? {} : JSON.parse(window.__SECRET_CONFIG);
} else {
    SERVER_CONFIG = {};
}

const config = () => {
    try {
        return merge(defaultConfig, SERVER_CONFIG);
    } catch (e) {
        return defaultConfig;
    }
};

// https://github.com/developit/dlv
// config.get('my.nested.config', 'defaultValue')
export default {
    get: (value, def = '') => delve(config(), value, def),
};
