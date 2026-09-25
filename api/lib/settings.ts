import config from '../config';
import prisma from './db';

const settingsCache = new Map();

/**
 * Gets instance settings, fetching from database if not cached.
 * Use this utility to avoid duplicating the cache-check pattern.
 */
async function getInstanceSettings() {
    let cachedSettings = settingsCache.get('instanceSettings');
    if (!cachedSettings) {
        try {
            cachedSettings = await prisma.instanceSettings.findFirst();
            if (cachedSettings) {
                settingsCache.set('instanceSettings', cachedSettings);
            }
        } catch {
            // Table may not exist yet (fresh database)
            return null;
        }
    }
    return cachedSettings;
}

/**
 * Resolves instance settings from the appropriate source.
 * In managed mode, returns environment-based settings; otherwise fetches from database.
 * Outside managed mode, a set environment override wins over the database value,
 * so that enforcement uses the same values that the settings API shows.
 */
export async function resolveSettings() {
    if (config.isManaged()) {
        return config.getManagedSettings();
    }

    const settings = await getInstanceSettings();
    const { values } = config.getEnvironmentOverrides();

    if (!settings || Object.keys(values).length === 0) {
        return settings;
    }

    return { ...settings, ...values };
}

/**
 * Updates the cached instance settings.
 * Call this after modifying settings in the database.
 */
export function setCachedInstanceSettings(settings: unknown) {
    settingsCache.set('instanceSettings', settings);
}

export default settingsCache;
