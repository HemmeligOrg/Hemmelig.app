import { Hono } from 'hono';
import prisma from '../lib/db';
import * as os from 'os';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { instanceSettingsSchema } from '../validations/instance';
import config from '../config';

const app = new Hono();

const selectFields = {
    instanceName: true,
    instanceDescription: true,
    allowRegistration: true,
    requireEmailVerification: true,
    maxSecretsPerUser: true,
    defaultSecretExpiration: true,
    maxSecretSize: true,
    allowPasswordProtection: true,
    allowIpRestriction: true,
    maxPasswordAttempts: true,
    enableRateLimiting: true,
    rateLimitRequests: true,
    rateLimitWindow: true,
};

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
        let dbSettings = await prisma.instanceSettings.findFirst({ select: selectFields });

        if (!dbSettings) {
            // Prepare initial data from config, filtering out undefined values
            const initialData = {
                ...Object.fromEntries(Object.entries(config.get('general')).filter(([, v]) => v !== undefined)),
                ...Object.fromEntries(Object.entries(config.get('security')).filter(([, v]) => v !== undefined)),
                ...Object.fromEntries(Object.entries(config.get('email')).filter(([, v]) => v !== undefined)),
            };

            dbSettings = await prisma.instanceSettings.create({
                data: initialData,
                select: selectFields,
            });
        }

        // Get config settings and filter out undefined values
        const configSettings = {
            ...config.get('general'),
            ...config.get('security'),
            ...config.get('email'),
        };
        const filteredConfigSettings = Object.fromEntries(
            Object.entries(configSettings).filter(([, value]) => value !== undefined)
        );

        // Override DB settings with any settings defined in config (env vars)
        const finalSettings = {
            ...dbSettings,
            ...filteredConfigSettings,
        };

        return c.json(finalSettings);
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
                select: selectFields,
            });

            return c.json(updatedSettings);
        } catch (error) {
            console.error('Failed to update instance settings:', error);
            throw new HTTPException(500, { message: 'Failed to update instance settings' });
        }
    }
);

export default app;
