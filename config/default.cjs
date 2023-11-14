const {
    SECRET_LOCAL_HOSTNAME = '0.0.0.0',
    SECRET_PORT = '3000',
    SECRET_HOST = 'localhost',
    SECRET_MASTER_KEY = '11111222223333344444555556666677', // has to be 32 in length
    SECRET_JWT_SECRET = 'good_luck_have_fun',
    SECRET_ROOT_USER = 'groot',
    SECRET_ROOT_PASSWORD = 'iamgroot',
    SECRET_ROOT_EMAIL = 'groot@hemmelig.app',
    SECRET_FILE_SIZE = 4, // 4 mb
    SECRET_FORCED_LANGUAGE = 'en',
    SECRET_DO_SPACES_ENDPOINT = '',
    SECRET_DO_SPACES_KEY = '',
    SECRET_DO_SPACES_SECRET = '',
    SECRET_DO_SPACES_BUCKET = '',
    SECRET_DO_SPACES_FOLDER = '',
    SECRET_AWS_S3_REGION = '',
    SECRET_AWS_S3_KEY = '',
    SECRET_AWS_S3_SECRET = '',
    SECRET_AWS_S3_BUCKET = '',
    SECRET_AWS_S3_FOLDER = '',
    SECRET_MAX_TEXT_SIZE = 256, // 256 kb
    SECRET_UPLOAD_RESTRICTION = 'true', // true = only allow uploads from signed in users
    NODE_ENV = 'development',
} = process.env;

const config = {
    localHostname: SECRET_LOCAL_HOSTNAME,
    env: NODE_ENV,
    host: SECRET_HOST,
    port: SECRET_PORT,
    secret_key: SECRET_MASTER_KEY,
    upload_restriction: JSON.parse(SECRET_UPLOAD_RESTRICTION),
    // root account management
    account: {
        root: {
            user: SECRET_ROOT_USER,
            password: SECRET_ROOT_PASSWORD,
            email: SECRET_ROOT_EMAIL,
        },
    },
    // choose digital ocean/s3 or disk
    file: {
        size: SECRET_FILE_SIZE,
        adapter: !!SECRET_DO_SPACES_SECRET ? 'do' : 'disk',
    },
    jwt: {
        secret: SECRET_JWT_SECRET,
        cookie: '__HEMMELIG_TOKEN',
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
    aws: {
        s3: {
            region: SECRET_AWS_S3_REGION,
            key: SECRET_AWS_S3_KEY,
            secret: SECRET_AWS_S3_SECRET,
            bucket: SECRET_AWS_S3_BUCKET,
            folder: SECRET_AWS_S3_FOLDER,
        },
    },
    disk: {
        // /var/tmp files can live up to 30 days
        folder: `/var/tmp/hemmelig/upload/files/`,
    },
    logger: true,
    cors: '*',
    __client_config: {
        api: {
            host: '/api',
        },
        settings: {
            forcedLanguage: SECRET_FORCED_LANGUAGE,
            upload_restriction: JSON.parse(SECRET_UPLOAD_RESTRICTION),
        },
    },
};

module.exports = config;
