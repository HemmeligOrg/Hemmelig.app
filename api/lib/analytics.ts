import { createHmac } from 'crypto';
import config from '../config';

const analyticsConfig = config.get('analytics') as { enabled: boolean; hmacSecret: string };

/**
 * Creates a unique, anonymous visitor ID using HMAC-SHA256.
 * This ensures privacy by never storing the raw IP address.
 */
export function createVisitorId(ip: string, userAgent: string): string {
    return createHmac('sha256', analyticsConfig.hmacSecret)
        .update(ip + userAgent)
        .digest('hex');
}

/**
 * Validates that a path is safe for analytics tracking.
 * Prevents injection of malicious paths.
 */
export function isValidAnalyticsPath(path: string): boolean {
    const pathRegex = /^\/[a-zA-Z0-9\-?=&/#]*$/;
    return pathRegex.test(path) && path.length <= 255;
}

/**
 * Checks if analytics tracking is enabled.
 */
export function isAnalyticsEnabled(): boolean {
    return analyticsConfig.enabled;
}

/**
 * Calculates the start date for a given time range.
 * @param timeRange - Time range string (7d, 14d, 30d)
 * @returns Start date for the query
 */
export function getStartDateForTimeRange(timeRange: '7d' | '14d' | '30d'): Date {
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
        case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
        case '14d':
            startDate.setDate(now.getDate() - 14);
            break;
        case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
    }

    return startDate;
}

/**
 * Calculates percentage with fixed decimal places, returning 0 if total is 0.
 */
export function calculatePercentage(value: number, total: number, decimals = 2): number {
    if (total === 0) return 0;
    return parseFloat(((value / total) * 100).toFixed(decimals));
}
