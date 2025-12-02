import { Context, Next } from 'hono';
import ipRangeCheck from 'ip-range-check';
import prisma from '../lib/db';
import { getClientIp } from '../lib/utils';

export const ipRestriction = async (c: Context, next: Next) => {
    const { id } = c.req.param();

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
};
