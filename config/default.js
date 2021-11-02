const {
    SECRET_LOCAL_HOSTNAME = '0.0.0.0',
    SECRET_PORT = '3000',
    SECRET_HOST = '',
    SECRET_MASTER_KEY = '11111222223333344444555556666677', // has to be 32 in length
    SECRET_REDIS_HOST = '0.0.0.0',
    SECRET_REDIS_PORT = 6379,
    SECRET_REDIS_USER = null,
    SECRET_REDIS_PASSWORD = null,
    SECRET_REDIS_TLS = false,
    SECRET_JWT_SECRET = 'good_luck_have_fun',
    SECRET_DO_SPACES_ENDPOINT = 'https://ams3.digitaloceanspaces.com',
    SECRET_DO_SPACES_KEY = '',
    SECRET_DO_SPACES_SECRET = '',
    SECRET_DO_SPACES_BUCKET = 'hemmelig',
    SECRET_DO_SPACES_FOLDER = 'localhost.hemmelig.app',
    SECRET_MAX_TEXT_SIZE = 256, // 256 kb
    NODE_ENV = 'development',
} = process.env;

module.exports = {
    localHostname: SECRET_LOCAL_HOSTNAME,
    env: NODE_ENV,
    host: SECRET_HOST,
    port: SECRET_PORT,
    secret_key: SECRET_MASTER_KEY,
    redis: {
        host: SECRET_REDIS_HOST,
        port: SECRET_REDIS_PORT,
        user: SECRET_REDIS_USER,
        password: SECRET_REDIS_PASSWORD,
        tls: SECRET_REDIS_TLS === 'true',
    },
    jwt: {
        secret: SECRET_JWT_SECRET,
    },
    api: {
        maxTextSize: SECRET_MAX_TEXT_SIZE * 1000, //  256 000 bytes
    },
    // Digital Ocean
    do: {
        spaces: {
            endpoint: SECRET_DO_SPACES_ENDPOINT,
            key: SECRET_DO_SPACES_KEY,
            secret: SECRET_DO_SPACES_SECRET,
            bucket: SECRET_DO_SPACES_BUCKET,
            folder: SECRET_DO_SPACES_FOLDER,
        },
    },
    logger: true,
    cors: '*',
    __client_config: {
        api: {
            host: '/api',
        },
        settings: {
            enableFileUpload: !!SECRET_DO_SPACES_SECRET,
        },
    },
};
