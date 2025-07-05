import { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import ipRangeCheck from 'ip-range-check';
import prisma from '../lib/db';

const getClientIp = (c: Context): string | undefined => {
    const forwardedFor = c.req.header('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return c.req.header('x-real-ip') ||
        c.req.header('cf-connecting-ip') ||
        c.req.header('client-ip') ||
        c.req.header('x-client-ip') ||
        c.req.header('x-cluster-client-ip') ||
        c.req.header('forwarded-for') ||
        c.req.header('forwarded') ||
        c.req.header('via');
};

export const ipRestriction = createMiddleware(async (c, next) => {
    const { id }: { id: string } = c.req.valid('param');

    const item = await prisma.secrets.findUnique({
        where: { id },
        select: {
            ipRange: true,
        }
    });

    // If no restriction is configured, move on
    if (!item?.ipRange) {
        return next();
    }

    const ip = getClientIp(c);

    if (!ip) {
        return c.json({ error: 'Could not identify client IP' }, 400);
    }

    // The core logic is now a single, clean line
    if (!ipRangeCheck(ip, item.ipRange)) {
        return c.json({ error: 'Access restricted by IP' }, 403);
    }

    await next();
});
