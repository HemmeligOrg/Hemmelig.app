const { SECRET_HOST = '' } = process.env;

const config = {
    cors: SECRET_HOST !== '' ? SECRET_HOST : '*',
};

module.exports = config;
