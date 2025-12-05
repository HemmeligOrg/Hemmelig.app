import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import config from '../config';
import { ADMIN_SETTINGS_FIELDS, PUBLIC_SETTINGS_FIELDS } from '../lib/constants';
import prisma from '../lib/db';
import settingsCache, { setCachedInstanceSettings } from '../lib/settings';
import { authMiddleware, checkAdmin } from '../middlewares/auth';
import { instanceSettingsSchema } from '../validations/instance';

const app = new Hono();

// GET /api/instance/settings/public - public settings for all users
app.get('/settings/public', async (c) => {
    try {
        let dbSettings = await prisma.instanceSettings.findFirst({
            select: PUBLIC_SETTINGS_FIELDS,
        });

        if (!dbSettings) {
            const initialData = {
                ...Object.fromEntries(
                    Object.entries(config.get('general')).filter(([, v]) => v !== undefined)
                ),
                ...Object.fromEntries(
                    Object.entries(config.get('security')).filter(([, v]) => v !== undefined)
                ),
            };

            dbSettings = await prisma.instanceSettings.create({
                data: initialData,
                select: PUBLIC_SETTINGS_FIELDS,
            });
        }

        const configSettings = {
            ...config.get('general'),
            ...config.get('security'),
        };
        const filteredConfigSettings = Object.fromEntries(
            Object.entries(configSettings).filter(
                ([key, value]) => value !== undefined && key in PUBLIC_SETTINGS_FIELDS
            )
        );

        const finalSettings = {
            ...dbSettings,
            ...filteredConfigSettings,
        };

        return c.json(finalSettings);
    } catch (error) {
        console.error('Failed to fetch public instance settings:', error);
        return c.json({ error: 'Failed to fetch instance settings' }, 500);
    }
});

// GET /api/instance/settings - admin only
app.get('/settings', authMiddleware, checkAdmin, async (c) => {
    try {
        let dbSettings = await prisma.instanceSettings.findFirst({ select: ADMIN_SETTINGS_FIELDS });

        if (!dbSettings) {
            const initialData = {
                ...Object.fromEntries(
                    Object.entries(config.get('general')).filter(([, v]) => v !== undefined)
                ),
                ...Object.fromEntries(
                    Object.entries(config.get('security')).filter(([, v]) => v !== undefined)
                ),
            };

            dbSettings = await prisma.instanceSettings.create({
                data: initialData,
                select: ADMIN_SETTINGS_FIELDS,
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
                select: ADMIN_SETTINGS_FIELDS,
            });

            const currentSettings = settingsCache.get('instanceSettings');
            setCachedInstanceSettings({
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
