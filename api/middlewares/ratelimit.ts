import { Context, Next } from 'hono';
import { rateLimiter } from 'hono-rate-limiter';
import settingsCache from '../lib/settings';
import { getClientIp } from '../lib/utils';

let rateLimitInstance: ReturnType<typeof rateLimiter> | null = null;

const ratelimit = async (c: Context, next: Next) => {
    const instanceSettings = settingsCache.get('instanceSettings');

    if (instanceSettings?.enableRateLimiting) {
        if (rateLimitInstance === null) {
            rateLimitInstance = rateLimiter({
                windowMs: instanceSettings.rateLimitWindow * 1000, // Convert seconds to milliseconds
                limit: instanceSettings.rateLimitRequests,
                standardHeaders: true,
                keyGenerator: (c) => getClientIp(c) || 'anonymous',
            });
        }

        return rateLimitInstance(c, next);
    }

    // If rate limiting is disabled, ensure the limiter is cleared
    if (rateLimitInstance !== null) {
        rateLimitInstance = null;
    }

    await next();
};

export default ratelimit;
