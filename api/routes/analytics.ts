import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { isbot } from 'isbot';
import { z } from 'zod';
import {
    calculatePercentage,
    createVisitorId,
    getStartDateForTimeRange,
    isAnalyticsEnabled,
    isValidAnalyticsPath,
} from '../lib/analytics';
import prisma from '../lib/db';
import { getClientIp } from '../lib/utils';
import { authMiddleware, checkAdmin } from '../middlewares/auth';

const app = new Hono();

const trackSchema = z.object({
    path: z.string().max(255),
});

const timeRangeSchema = z.object({
    timeRange: z.enum(['7d', '14d', '30d']).default('30d'),
});

// POST /api/analytics/track - Public endpoint for visitor tracking
app.post('/track', zValidator('json', trackSchema), async (c) => {
    if (!isAnalyticsEnabled()) {
        return c.json({ success: false }, 403);
    }

    const userAgent = c.req.header('user-agent') || '';

    if (isbot(userAgent)) {
        return c.json({ success: false }, 403);
    }

    try {
        const { path } = c.req.valid('json');

        if (!isValidAnalyticsPath(path)) {
            return c.json({ error: 'Invalid path format' }, 400);
        }

        const uniqueId = createVisitorId(getClientIp(c), userAgent);

        await prisma.visitorAnalytics.create({
            data: { path, uniqueId },
        });

        return c.json({ success: true }, 201);
    } catch (error) {
        console.error('Analytics tracking error:', error);
        return c.json({ error: 'Failed to track analytics' }, 500);
    }
});

// GET /api/analytics - Secret analytics (admin only)
app.get('/', authMiddleware, checkAdmin, zValidator('query', timeRangeSchema), async (c) => {
    const { timeRange } = c.req.valid('query');
    const now = new Date();
    const startDate = getStartDateForTimeRange(timeRange);

    try {
        // Use aggregations for basic counts - much more efficient than loading all records
        const [aggregates, activeCount, typesCounts, dailyStats, secretRequestStats] =
            await Promise.all([
                // Get total count and sum of views
                prisma.secrets.aggregate({
                    where: { createdAt: { gte: startDate } },
                    _count: true,
                    _sum: { views: true },
                }),
                // Count active (non-expired) secrets
                prisma.secrets.count({
                    where: {
                        createdAt: { gte: startDate },
                        expiresAt: { gt: now },
                    },
                }),
                // Get counts for secret types in parallel
                Promise.all([
                    prisma.secrets.count({
                        where: { createdAt: { gte: startDate }, password: { not: null } },
                    }),
                    prisma.secrets.count({
                        where: {
                            createdAt: { gte: startDate },
                            ipRange: { not: null },
                            NOT: { ipRange: '' },
                        },
                    }),
                    prisma.secrets.count({
                        where: { createdAt: { gte: startDate }, isBurnable: true },
                    }),
                ]),
                // For daily stats, we still need individual records but only select minimal fields
                prisma.secrets.findMany({
                    where: { createdAt: { gte: startDate } },
                    select: {
                        createdAt: true,
                        views: true,
                        expiresAt: true,
                    },
                }),
                // Secret request statistics
                Promise.all([
                    prisma.secretRequest.count({
                        where: { createdAt: { gte: startDate } },
                    }),
                    prisma.secretRequest.count({
                        where: { createdAt: { gte: startDate }, status: 'fulfilled' },
                    }),
                ]),
            ]);

        const totalSecrets = aggregates._count;
        const totalViews = aggregates._sum.views || 0;
        const activeSecrets = activeCount;
        const expiredSecrets = totalSecrets - activeSecrets;
        const averageViews = totalSecrets > 0 ? totalViews / totalSecrets : 0;

        const [passwordProtected, ipRestricted, burnable] = typesCounts;
        const [totalSecretRequests, fulfilledSecretRequests] = secretRequestStats;

        // Process daily stats from minimal data
        const dailyStatsMap = dailyStats.reduce(
            (acc, secret) => {
                const date = secret.createdAt.toISOString().split('T')[0];
                if (!acc[date]) {
                    acc[date] = { date, secrets: 0, views: 0 };
                }
                acc[date].secrets++;
                acc[date].views += secret.views || 0;
                return acc;
            },
            {} as Record<string, { date: string; secrets: number; views: number }>
        );

        // Calculate expiration stats from minimal data
        const expirationDurations = dailyStats.map(
            (s) => (s.expiresAt.getTime() - s.createdAt.getTime()) / (1000 * 60 * 60)
        );
        const oneHour = expirationDurations.filter((d) => d <= 1).length;
        const oneDay = expirationDurations.filter((d) => d > 1 && d <= 24).length;
        const oneWeekPlus = expirationDurations.filter((d) => d > 24).length;

        return c.json({
            totalSecrets,
            totalViews,
            activeSecrets,
            expiredSecrets,
            averageViews: parseFloat(averageViews.toFixed(2)),
            dailyStats: Object.values(dailyStatsMap),
            secretTypes: {
                passwordProtected: calculatePercentage(passwordProtected, totalSecrets),
                ipRestricted: calculatePercentage(ipRestricted, totalSecrets),
                burnable: calculatePercentage(burnable, totalSecrets),
            },
            expirationStats: {
                oneHour: calculatePercentage(oneHour, totalSecrets),
                oneDay: calculatePercentage(oneDay, totalSecrets),
                oneWeekPlus: calculatePercentage(oneWeekPlus, totalSecrets),
            },
            secretRequests: {
                total: totalSecretRequests,
                fulfilled: fulfilledSecretRequests,
            },
        });
    } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        return c.json({ error: 'Failed to fetch analytics data' }, 500);
    }
});

// GET /api/analytics/visitors - Visitor analytics data (admin only)
app.get('/visitors', authMiddleware, checkAdmin, async (c) => {
    try {
        const analytics = await prisma.visitorAnalytics.findMany({
            orderBy: { timestamp: 'desc' },
            take: 1000,
        });
        return c.json(analytics);
    } catch (error) {
        console.error('Analytics retrieval error:', error);
        return c.json({ error: 'Failed to retrieve analytics' }, 500);
    }
});

// GET /api/analytics/visitors/unique - Aggregated unique visitor data (admin only)
app.get('/visitors/unique', authMiddleware, checkAdmin, async (c) => {
    try {
        const aggregatedData = await prisma.visitorAnalytics.groupBy({
            by: ['uniqueId', 'path'],
            _count: { uniqueId: true },
            orderBy: { _count: { uniqueId: 'desc' } },
        });
        return c.json(aggregatedData);
    } catch (error) {
        console.error('Aggregated analytics retrieval error:', error);
        return c.json({ error: 'Failed to retrieve aggregated analytics' }, 500);
    }
});

// GET /api/analytics/visitors/daily - Daily visitor statistics (admin only)
app.get(
    '/visitors/daily',
    authMiddleware,
    checkAdmin,
    zValidator('query', timeRangeSchema),
    async (c) => {
        try {
            const { timeRange } = c.req.valid('query');
            const startDate = getStartDateForTimeRange(timeRange);

            // Use raw SQL for efficient database-level aggregation
            // This avoids loading all records into memory for high-traffic instances
            const aggregatedData = await prisma.$queryRaw<
                Array<{
                    date: string;
                    unique_visitors: bigint;
                    total_visits: bigint;
                    paths: string;
                }>
            >`
            SELECT
                DATE(timestamp) as date,
                COUNT(DISTINCT uniqueId) as unique_visitors,
                COUNT(*) as total_visits,
                GROUP_CONCAT(DISTINCT path) as paths
            FROM visitor_analytics
            WHERE timestamp >= ${startDate}
            GROUP BY DATE(timestamp)
            ORDER BY date ASC
        `;

            // Convert BigInt to number for JSON serialization
            const result = aggregatedData.map((row) => ({
                date: row.date,
                unique_visitors: Number(row.unique_visitors),
                total_visits: Number(row.total_visits),
                paths: row.paths || '',
            }));

            return c.json(result);
        } catch (error) {
            console.error('Daily analytics retrieval error:', error);
            return c.json({ error: 'Failed to retrieve daily analytics' }, 500);
        }
    }
);

export default app;
