export default {
    api: {
        host: '/api',
    },
    settings: {
        forcedLanguage: '',
    },
    git: {
        sha: import.meta.env.VITE_GIT_SHA || 'development',
        tag: import.meta.env.VITE_GIT_TAG || 'development',
    },
};
