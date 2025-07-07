import { Hono } from 'hono';
import prisma from '../lib/db';
import * as os from 'os';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { instanceSettingsSchema } from '../validations/instance';

const app = new Hono();

// GET /api/instance/status
app.get('/status', async (c) => {
    try {
        const totalSecrets = await prisma.secrets.count();
        const totalUsers = await prisma.user.count();

        return c.json({
            version: process.env.npm_package_version || 'dev',
            uptime: os.uptime(),
            totalSecrets,
            totalUsers,
            memoryUsage: process.memoryUsage().rss,
            cpuUsage: os.loadavg()[0],
            status: 'healthy',
        });
    } catch (error) {
        console.error('Failed to fetch system status:', error);
        throw new HTTPException(500, { message: 'Failed to fetch system status' });
    }
});

// GET /api/instance/settings
app.get('/settings', async (c) => {
    try {
        let settings = await prisma.instanceSettings.findFirst();

        if (!settings) {
            settings = await prisma.instanceSettings.create({
                data: {},
            });
        }

        return c.json(settings);
    } catch (error) {
        console.error('Failed to fetch instance settings:', error);
        throw new HTTPException(500, { message: 'Failed to fetch instance settings' });
    }
});

// PUT /api/instance/settings
app.put(
    '/settings',
    zValidator('json', instanceSettingsSchema),
    async (c) => {
        const body = c.req.valid('json');

        try {
            const settings = await prisma.instanceSettings.findFirst();
            const updatedSettings = await prisma.instanceSettings.update({
                where: { id: settings.id },
                data: body,
            });

            return c.json(updatedSettings);
        } catch (error) {
            console.error('Failed to update instance settings:', error);
            throw new HTTPException(500, { message: 'Failed to update instance settings' });
        }
    }
);

export default app;
