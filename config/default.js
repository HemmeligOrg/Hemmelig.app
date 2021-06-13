const {
    SECRET_HOSTNAME = '0.0.0.0',
    SECRET_PORT = '3000',
    SECRET_MASTER_KEY = '11111222223333344444555556666677', // has to be 32 in length
    SECRET_REDIS_HOST = '0.0.0.0',
    SECRET_REDIS_PORT = 6379,
    SECRET_REDIS_USER = null,
    SECRET_REDIS_PASSWORD = null,
    SECRET_REDIS_TLS = false,
} = process.env;

module.exports = {
    hostname: SECRET_HOSTNAME,
    port: SECRET_PORT,
    secret_key: SECRET_MASTER_KEY,
    redis: {
        host: SECRET_REDIS_HOST,
        port: SECRET_REDIS_PORT,
        user: SECRET_REDIS_USER,
        password: SECRET_REDIS_PASSWORD,
        tls: SECRET_REDIS_TLS === 'true',
    },
    logger: true,
    cors: '*',
};
