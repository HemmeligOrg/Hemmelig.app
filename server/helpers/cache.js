const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

function getCacheKey(endpoint) {
    return `analytics_${endpoint}`;
}

function getFromCache(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    cache.delete(key);
    return null;
}

function setCache(key, data) {
    cache.set(key, {
        timestamp: Date.now(),
        data,
    });
}

export { getCacheKey, getFromCache, setCache };
