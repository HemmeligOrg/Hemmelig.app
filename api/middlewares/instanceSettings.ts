import { createMiddleware } from 'hono/factory';
import prisma from '../lib/db';
export const instanceSettingsMiddleware = createMiddleware(async (c, next) => {
    try {
        const dbSettings = await prisma.instanceSettings.findFirst();
        c.set('instanceSettings', dbSettings || {});
    } catch (error) {
        console.error('Failed to load instance settings in middleware:', error);
    }
    await next();
});
