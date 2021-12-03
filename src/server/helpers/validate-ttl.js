const VALID_TTL = [
    604800, // 7 days
    259200, // 3 days
    86400, // 1 day
    43200, // 12 hours
    14400, // 4 hours
    3600, // 1 hour
    1800, // 30 minutes
    300, // 5 minutes
    0, // never expire
];

module.exports = function isValidTTL(ttl) {
    return VALID_TTL.some((_ttl) => _ttl === ttl);
};
