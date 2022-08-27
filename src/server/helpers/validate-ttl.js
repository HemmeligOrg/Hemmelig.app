const VALID_TTL = [
    2419200, // 28 days
    1209600, // 14 days
    604800, // 7 days
    259200, // 3 days
    86400, // 1 day
    43200, // 12 hours
    14400, // 4 hours
    3600, // 1 hour
    1800, // 30 minutes
    300, // 5 minutes
];

export default function isValidTTL(ttl) {
    return VALID_TTL.some((_ttl) => _ttl === ttl);
}
