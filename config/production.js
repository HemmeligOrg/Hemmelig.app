const { SECRET_HOST = '' } = process.env;

module.exports = {
    cors: SECRET_HOST !== '' ? SECRET_HOST : '*',
};
