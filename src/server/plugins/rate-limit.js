import fp from 'fastify-plugin';
import getClientIp from '../helpers/client-ip.js';

const store = new Map();

const defaultOptions = {
    prefix: '/',
    max: 1000, // x requests
    timeWindow: 60 * 1000, // 1 minute
};

// Consider to extract this functionality to a separate plugin,
// and publish it on NPM
// Refactor the code into a class
// and make a redis adapter for it
export default fp(function (fastify, opts = defaultOptions, done) {
    fastify.decorate('rateLimit', async (req, res) => {
        if (!req.url.startsWith(opts.prefix)) {
            done();
        }

        const ip = getClientIp(req.headers);
        const key = `${req.method}${req.url}${ip}`;

        const currentTime = Date.now();

        if (!store.has(key) || currentTime > store.get(key)?.reset) {
            store.set(key, {
                count: 0,
                reset: currentTime + opts.timeWindow,
            });
        }

        const current = store.get(key);
        current.count += 1;

        const resetTime = Math.floor((current.reset - currentTime) / 1000);

        if (current.count > opts.max && currentTime <= current.reset) {
            res.header('X-RateLimit-Reset', resetTime);

            return res.code(429).send({ message: 'Too many requests, please try again later.' });
        }

        res.header('X-RateLimit-Limit', opts.max);
        res.header('X-RateLimit-Remaining', opts.max - current.count);
        res.header('X-RateLimit-Reset', resetTime);
    });

    fastify.addHook('onRequest', fastify.rateLimit);
    done();
});
