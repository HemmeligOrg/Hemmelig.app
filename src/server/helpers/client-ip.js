const config = require('config');

module.exports = function getClientIp(headers) {
    // Iterate through a list of headers allowed to fetch the ip from
    const checkHeaders = [
        'do-connecting-ip', // digital ocean app platform
        'x-forwarded-for',
    ];

    if (config.get('env') === 'development') {
        checkHeaders.push('host');
    }

    // return the first existing header
    return checkHeaders.find((header) => header in headers);
};
