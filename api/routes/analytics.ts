import { Hono } from 'hono';
import { authMiddleware, checkAdmin } from '../middlewares/auth';
import { HTTPException } from 'hono/http-exception';
import prisma from '../lib/db';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono().use(checkAdmin);

const schema = z.object({
    timeRange: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
});

app.get('/', authMiddleware, zValidator('query', schema), async (c) => {
    if (c.get('user')?.role !== 'admin') {
        throw new HTTPException(403, { message: 'Forbidden' });
    }

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
        throw new HTTPException(500, { message: 'Failed to fetch analytics data' });
    }
});

export default app;
