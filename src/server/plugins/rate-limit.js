import fp from 'fastify-plugin';
import getClientIp from '../helpers/client-ip.js';

const store = new Map();

export default fp(function (fastify, opts, done) {
    fastify.decorate('rateLimit', async (req, res) => {
        if (!req.url.startsWith(opts.prefix)) {
            done();
        }

        const ip = getClientIp(req.headers);
        const key = `${req.method}${req.url}${ip}`;

        const currentTime = Date.now();
        const resetTime = currentTime + opts.timeWindow;

        if (!store.has(key) || currentTime > store.get(key)?.reset) {
            store.set(key, {
                count: 0,
                reset: resetTime,
            });
        }

        const current = store.get(key);
        current.count += 1;

        if (current.count > opts.max && currentTime <= current.reset) {
            return res.code(429).send({ message: 'Too many requests, please try again later.' });
        }

        res.header('X-RateLimit-Limit', opts.max);
        res.header('X-RateLimit-Remaining', opts.max - current.count);
        res.header('X-RateLimit-Reset', Math.floor((current.reset - currentTime) / 1000));
    });

    fastify.addHook('onRequest', fastify.rateLimit);
    done();
});
