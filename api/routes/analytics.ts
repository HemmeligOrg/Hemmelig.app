import { Hono } from 'hono';
import { authMiddleware, checkAdmin } from '../middlewares/auth';
import prisma from '../lib/db';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createHmac } from 'crypto';
import { isbot } from 'isbot';
import config from '../config';
import { getClientIp } from '../lib/utils';

const app = new Hono();

const analyticsConfig = config.get('analytics') as { enabled: boolean; hmacSecret: string };

function createUniqueId(ip: string, userAgent: string): string {
    return createHmac('sha256', analyticsConfig.hmacSecret)
        .update(ip + userAgent)
        .digest('hex');
}

function isValidPath(path: string): boolean {
    const pathRegex = /^\/[a-zA-Z0-9\-?=&/#]*$/;
    return pathRegex.test(path) && path.length <= 255;
}

const trackSchema = z.object({
    path: z.string().max(255),
});

const timeRangeSchema = z.object({
    timeRange: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
});

// POST /api/analytics/track - Public endpoint for visitor tracking
app.post('/track', zValidator('json', trackSchema), async (c) => {
    if (!analyticsConfig.enabled) {
        return c.json({ success: false }, 403);
    }

    const userAgent = c.req.header('user-agent') || '';
    
    if (isbot(userAgent)) {
        return c.json({ success: false }, 403);
    }

    try {
        const { path } = c.req.valid('json');

        if (!isValidPath(path)) {
            return c.json({ error: 'Invalid path format' }, 400);
        }

        const uniqueId = createUniqueId(getClientIp(c), userAgent);

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
    const startDate = new Date();

    switch (timeRange) {
        case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
        case '30d':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case '90d':
            startDate.setMonth(now.getMonth() - 3);
            break;
        case '1y':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
    }

    try {
        const secrets = await prisma.secrets.findMany({ where: { createdAt: { gte: startDate } } });

        const totalSecrets = secrets.length;
        const totalViews = secrets.reduce((acc, s) => acc + (s.views || 0), 0);
        const activeSecrets = secrets.filter(s => s.expiresAt > now).length;
        const expiredSecrets = totalSecrets - activeSecrets;
        const averageViews = totalSecrets > 0 ? totalViews / totalSecrets : 0;

        const dailyStats = secrets.reduce((acc, secret) => {
            const date = secret.createdAt.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { date, secrets: 0, views: 0 };
            }
            acc[date].secrets++;
            acc[date].views += secret.views || 0;
            return acc;
        }, {} as Record<string, { date: string; secrets: number; views: number }>);

        const passwordProtected = secrets.filter(s => s.password).length;
        const ipRestricted = secrets.filter(s => s.ipRange).length;
        const burnable = secrets.filter(s => s.isBurnable).length;

        const expirationDurations = secrets.map(s => (s.expiresAt.getTime() - s.createdAt.getTime()) / (1000 * 60 * 60));
        const oneHour = expirationDurations.filter(d => d <= 1).length;
        const oneDay = expirationDurations.filter(d => d > 1 && d <= 24).length;
        const oneWeekPlus = expirationDurations.filter(d => d > 24).length;

        return c.json({
            totalSecrets,
            totalViews,
            activeSecrets,
            expiredSecrets,
            averageViews: parseFloat(averageViews.toFixed(2)),
            dailyStats: Object.values(dailyStats),
            secretTypes: {
                passwordProtected: totalSecrets > 0 ? parseFloat(((passwordProtected / totalSecrets) * 100).toFixed(2)) : 0,
                ipRestricted: totalSecrets > 0 ? parseFloat(((ipRestricted / totalSecrets) * 100).toFixed(2)) : 0,
                burnable: totalSecrets > 0 ? parseFloat(((burnable / totalSecrets) * 100).toFixed(2)) : 0,
            },
            expirationStats: {
                oneHour: totalSecrets > 0 ? parseFloat(((oneHour / totalSecrets) * 100).toFixed(2)) : 0,
                oneDay: totalSecrets > 0 ? parseFloat(((oneDay / totalSecrets) * 100).toFixed(2)) : 0,
                oneWeekPlus: totalSecrets > 0 ? parseFloat(((oneWeekPlus / totalSecrets) * 100).toFixed(2)) : 0,
            }
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
app.get('/visitors/daily', authMiddleware, checkAdmin, async (c) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const visitors = await prisma.visitorAnalytics.findMany({
            where: { timestamp: { gte: thirtyDaysAgo } },
            orderBy: { timestamp: 'desc' },
        });

        const dailyMap = new Map<string, { uniqueIds: Set<string>; total: number; paths: Set<string> }>();

        for (const visitor of visitors) {
            const date = visitor.timestamp.toISOString().split('T')[0];
            if (!dailyMap.has(date)) {
                dailyMap.set(date, { uniqueIds: new Set(), total: 0, paths: new Set() });
            }
            const day = dailyMap.get(date)!;
            day.uniqueIds.add(visitor.uniqueId);
            day.total++;
            day.paths.add(visitor.path);
        }

        const aggregatedData = Array.from(dailyMap.entries())
            .map(([date, data]) => ({
                date,
                unique_visitors: data.uniqueIds.size,
                total_visits: data.total,
                paths: Array.from(data.paths).join(','),
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return c.json(aggregatedData);
    } catch (error) {
        console.error('Daily analytics retrieval error:', error);
        return c.json({ error: 'Failed to retrieve daily analytics' }, 500);
    }
});

export default app;
