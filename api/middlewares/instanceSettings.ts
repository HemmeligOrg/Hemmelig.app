import { createMiddleware } from 'hono/factory';

export const instanceSettingsMiddleware = (instanceSettings) => createMiddleware(async (c, next) => {
    try {
        c.set('instanceSettings', instanceSettings || {});
    } catch (error) {
        console.error('Failed to load instance settings in middleware:', error);
    }
    await next();
});
