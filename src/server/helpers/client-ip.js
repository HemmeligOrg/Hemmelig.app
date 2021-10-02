const config = require('config');

module.exports = function getClientIp(headers) {
    // Iterate through a list of headers allowed to fetch the ip from
    const checkHeaders = [
        'do-connecting-ip', // digital ocean app platform
        'x-real-ip',
        'x-forwarded-for',
    ];

    if (config.get('env') === 'development') {
        checkHeaders.push('host');
    }

    const header = checkHeaders.find((header) => headers[header]);

    // return the first existing header
    return headers[header] ? headers[header] : '';
};
// redux
