import { timingSafeEqual } from 'crypto';
import { Hono } from 'hono';
import { collectDefaultMetrics, Gauge, Histogram, register, Registry } from 'prom-client';
import prisma from '../lib/db';
import { resolveSettings } from '../lib/settings';

const app = new Hono();

// Create a custom registry
const metricsRegistry = new Registry();

// Collect default Node.js metrics (memory, CPU, event loop, etc.)
collectDefaultMetrics({ register: metricsRegistry });

// Custom application metrics
const activeSecretsGauge = new Gauge({
    name: 'hemmelig_secrets_active_count',
    help: 'Current number of active (unexpired) secrets',
    registers: [metricsRegistry],
});

const totalUsersGauge = new Gauge({
    name: 'hemmelig_users_total',
    help: 'Total number of registered users',
    registers: [metricsRegistry],
});

const visitorsUnique30dGauge = new Gauge({
    name: 'hemmelig_visitors_unique_30d',
    help: 'Unique visitors in the last 30 days',
    registers: [metricsRegistry],
});

const visitorsViews30dGauge = new Gauge({
    name: 'hemmelig_visitors_views_30d',
    help: 'Total page views in the last 30 days',
    registers: [metricsRegistry],
});

const httpRequestDuration = new Histogram({
    name: 'hemmelig_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [metricsRegistry],
});

// Function to update gauge metrics from database
async function updateGaugeMetrics() {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Count active secrets (not expired)
        const activeSecrets = await prisma.secrets.count({
            where: {
                expiresAt: {
                    gt: now,
                },
            },
        });
        activeSecretsGauge.set(activeSecrets);

        // Count total users
        const totalUsers = await prisma.user.count();
        totalUsersGauge.set(totalUsers);

        // Get visitor stats for the last 30 days
        const visitorStats = await prisma.$queryRaw<
            Array<{ unique_visitors: bigint; total_views: bigint }>
        >`
            SELECT
                COUNT(DISTINCT uniqueId) as unique_visitors,
                COUNT(*) as total_views
            FROM visitor_analytics
            WHERE timestamp >= ${thirtyDaysAgo}
        `;

        if (visitorStats.length > 0) {
            visitorsUnique30dGauge.set(Number(visitorStats[0].unique_visitors));
            visitorsViews30dGauge.set(Number(visitorStats[0].total_views));
        }
    } catch (error) {
        console.error('Failed to update metrics gauges:', error);
    }
}

// Helper function to verify Bearer token using constant-time comparison
function verifyBearerToken(authHeader: string | undefined, expectedSecret: string): boolean {
    if (!authHeader || !expectedSecret) {
        return false;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return false;
    }

    const provided = Buffer.from(parts[1]);
    const expected = Buffer.from(expectedSecret);

    // Pad to same length to prevent timing leaks on token length
    const maxLen = Math.max(provided.length, expected.length);
    const paddedProvided = Buffer.alloc(maxLen);
    const paddedExpected = Buffer.alloc(maxLen);
    provided.copy(paddedProvided);
    expected.copy(paddedExpected);

    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(paddedProvided, paddedExpected) && provided.length === expected.length;
}

// GET /api/metrics - Prometheus metrics endpoint
app.get('/', async (c) => {
    try {
        const settings = await resolveSettings();

        // Check if metrics are enabled
        if (!settings?.metricsEnabled) {
            return c.json({ error: 'Metrics endpoint is disabled' }, 404);
        }

        // Verify authentication if secret is configured
        if (settings.metricsSecret) {
            const authHeader = c.req.header('Authorization');
            if (!verifyBearerToken(authHeader, settings.metricsSecret)) {
                return c.json({ error: 'Unauthorized' }, 401);
            }
        }

        // Update gauge metrics before returning
        await updateGaugeMetrics();

        // Get metrics in Prometheus format
        const metrics = await metricsRegistry.metrics();

        return c.text(metrics, 200, {
            'Content-Type': register.contentType,
        });
    } catch (error) {
        console.error('Failed to generate metrics:', error);
        return c.json({ error: 'Failed to generate metrics' }, 500);
    }
});

export function observeHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number
) {
    httpRequestDuration.labels(method, route, String(statusCode)).observe(duration);
}

export default app;
