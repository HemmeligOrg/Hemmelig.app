import merge from 'deepmerge';
import delve from 'dlv';
import defaultConfig from './config/default';

let NODE_ENV;

if (typeof window !== 'undefined') {
    NODE_ENV = window.__ENV === '{{NODE_ENV}}' ? 'development' : window.__ENV;
} else {
    NODE_ENV = 'production';
}

const config = () => {
    try {
        return merge(defaultConfig, require(`./config/${NODE_ENV}.js`).default);
    } catch (e) {
        console.log(` CONFIG: Environment "${NODE_ENV}" not found.`);

        return defaultConfig;
    }
};

// https://github.com/developit/dlv
// config.get('my.nested.config', 'defaultValue')
export default {
    get: (value, def = '') => delve(config(), value, def),
};
