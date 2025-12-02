import { Hono } from 'hono';
import prisma from '../lib/db';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, checkAdmin } from '../middlewares/auth';
import { instanceSettingsSchema } from '../validations/instance';
import instanceSettings from '../instance-settings';
import config from '../config';

const app = new Hono();

const selectFields = {
    instanceName: true,
    instanceDescription: true,
    allowRegistration: true,
    requireEmailVerification: true,
    defaultSecretExpiration: true,
    maxSecretSize: true,
    allowPasswordProtection: true,
    allowIpRestriction: true,
    enableRateLimiting: true,
    rateLimitRequests: true,
    rateLimitWindow: true,
    requireInviteCode: true,
    allowedEmailDomains: true,
};

// GET /api/instance/settings
app.get('/settings', async (c) => {
    try {
        let dbSettings = await prisma.instanceSettings.findFirst({ select: selectFields });

        if (!dbSettings) {
            const initialData = {
                ...Object.fromEntries(Object.entries(config.get('general')).filter(([, v]) => v !== undefined)),
                ...Object.fromEntries(Object.entries(config.get('security')).filter(([, v]) => v !== undefined)),
            };

            dbSettings = await prisma.instanceSettings.create({
                data: initialData,
                select: selectFields,
            });
        }

        const configSettings = {
            ...config.get('general'),
            ...config.get('security'),
        };
        const filteredConfigSettings = Object.fromEntries(
            Object.entries(configSettings).filter(([, value]) => value !== undefined)
        );

        const finalSettings = {
            ...dbSettings,
            ...filteredConfigSettings,
        };

        return c.json(finalSettings);
    } catch (error) {
        console.error('Failed to fetch instance settings:', error);
        return c.json({ error: 'Failed to fetch instance settings' }, 500);
    }
});


// PUT /api/instance/settings
app.put(
    '/settings',
    authMiddleware,
    checkAdmin,
    zValidator('json', instanceSettingsSchema),
    async (c) => {
        const body = c.req.valid('json');

        try {
            const settings = await prisma.instanceSettings.findFirst();
            
            if (!settings) {
                return c.json({ error: 'Instance settings not found' }, 404);
            }

            const updatedSettings = await prisma.instanceSettings.update({
                where: { id: settings.id },
                data: body,
                select: selectFields,
            });

            const currentSettings = instanceSettings.get('instanceSettings');
            instanceSettings.set('instanceSettings', {
                ...currentSettings,
                ...updatedSettings,
            });

            return c.json(updatedSettings);
        } catch (error) {
            console.error('Failed to update instance settings:', error);
            return c.json({ error: 'Failed to update instance settings' }, 500);
        }
    }
);

export default app;
