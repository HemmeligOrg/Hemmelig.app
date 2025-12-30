import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import config from '../config';
import { ADMIN_SETTINGS_FIELDS, PUBLIC_SETTINGS_FIELDS } from '../lib/constants';
import prisma from '../lib/db';
import settingsCache, { setCachedInstanceSettings } from '../lib/settings';
import { handleNotFound } from '../lib/utils';
import { authMiddleware, checkAdmin } from '../middlewares/auth';
import { instanceSettingsSchema } from '../validations/instance';

const app = new Hono();

// GET /api/instance/managed - check if instance is in managed mode
app.get('/managed', async (c) => {
    return c.json({ managed: config.isManaged() });
});

// GET /api/instance/settings/public - public settings for all users
app.get('/settings/public', async (c) => {
    try {
        // In managed mode, return settings from environment variables
        if (config.isManaged()) {
            const managedSettings = config.getManagedSettings();
            const publicSettings = Object.fromEntries(
                Object.entries(managedSettings || {}).filter(
                    ([key]) => key in PUBLIC_SETTINGS_FIELDS
                )
            );
            return c.json(publicSettings);
        }

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
        // In managed mode, return settings from environment variables
        if (config.isManaged()) {
            const managedSettings = config.getManagedSettings();
            return c.json(managedSettings);
        }

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
        // Block updates in managed mode
        if (config.isManaged()) {
            return c.json(
                { error: 'Instance is in managed mode. Settings cannot be modified.' },
                403
            );
        }

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
            return handleNotFound(error as Error & { code?: string }, c);
        }
    }
);

export default app;
