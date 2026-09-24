import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import config from '../config';
import { ADMIN_SETTINGS_FIELDS, PUBLIC_SETTINGS_FIELDS } from '../lib/constants';
import prisma from '../lib/db';
import settingsCache, { setCachedInstanceSettings } from '../lib/settings';
import { handleNotFound, isPublicUrl } from '../lib/utils';
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

        // Environment variables that are set win over the database values.
        const { values } = config.getEnvironmentOverrides();
        const publicOverrides = Object.fromEntries(
            Object.entries(values).filter(([key]) => key in PUBLIC_SETTINGS_FIELDS)
        );

        return c.json({ ...dbSettings, ...publicOverrides });
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

        // Environment variables that are set win over the database values. The
        // response names them, so the admin UI can show those rows as read-only.
        const { values, variables } = config.getEnvironmentOverrides();

        return c.json({ ...dbSettings, ...values, lockedByEnvironment: variables });
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
        const { values, variables } = config.getEnvironmentOverrides();
        const bodyValues: Record<string, unknown> = body;

        // An environment variable controls these settings. A different value is
        // rejected, so that a save cannot report success for a value that the
        // environment replaces. An equal value is ignored.
        const conflicts = Object.keys(variables).filter(
            (key) => bodyValues[key] !== undefined && bodyValues[key] !== values[key]
        );
        if (conflicts.length > 0) {
            return c.json(
                {
                    error: `Set by environment variable: ${conflicts.map((key) => variables[key]).join(', ')}`,
                },
                409
            );
        }
        const data = { ...body };
        for (const key of Object.keys(variables)) {
            delete (data as Record<string, unknown>)[key];
        }

        if (body.webhookUrl && body.webhookUrl !== '' && !(await isPublicUrl(body.webhookUrl))) {
            return c.json({ error: 'Webhook URL cannot point to private/internal addresses' }, 400);
        }

        try {
            const settings = await prisma.instanceSettings.findFirst();

            if (!settings) {
                return c.json({ error: 'Instance settings not found' }, 404);
            }

            const updatedSettings = await prisma.instanceSettings.update({
                where: { id: settings.id },
                data,
                select: ADMIN_SETTINGS_FIELDS,
            });

            const currentSettings = settingsCache.get('instanceSettings');
            setCachedInstanceSettings({
                ...currentSettings,
                ...updatedSettings,
            });

            return c.json({ ...updatedSettings, ...values, lockedByEnvironment: variables });
        } catch (error) {
            console.error('Failed to update instance settings:', error);
            return handleNotFound(error as Error & { code?: string }, c);
        }
    }
);

export default app;
