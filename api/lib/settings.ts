import prisma from './db';

const settingsCache = new Map();

// Initialize cache on module load
settingsCache.set('instanceSettings', await prisma.instanceSettings.findFirst());

/**
 * Gets instance settings, fetching from database if not cached.
 * Use this utility to avoid duplicating the cache-check pattern.
 */
export async function getInstanceSettings() {
    let cachedSettings = settingsCache.get('instanceSettings');
    if (!cachedSettings) {
        cachedSettings = await prisma.instanceSettings.findFirst();
        if (cachedSettings) {
            settingsCache.set('instanceSettings', cachedSettings);
        }
    }
    return cachedSettings;
}

/**
 * Updates the cached instance settings.
 * Call this after modifying settings in the database.
 */
export function setCachedInstanceSettings(settings: unknown) {
    settingsCache.set('instanceSettings', settings);
}

/**
 * Gets the raw settings cache (for direct access when needed).
 */
export function getSettingsCache() {
    return settingsCache;
}

export default settingsCache;
