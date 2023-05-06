import config from 'config';

export default function getClientIp(headers) {
    // Iterate through a list of headers allowed to fetch the ip from
    const checkHeaders = [
        'cf-connecting-ip', // cloudflare
        'do-connecting-ip', // digital ocean app platform
        'true-client-ip', // used for cloudfront
        'x-real-ip',
        'x-forwarded-for',
    ];

    if (config.get('env') === 'development') {
        checkHeaders.push('host');
    }

    const header = checkHeaders.find((header) => headers[header]);

    const ip = headers[header] ? headers[header] : '';

    if (ip && ip.includes(',')) {
        // return the first ip in the list
        return ip.split(',')[0];
    }

    // return the first existing header
    return ip;
}
