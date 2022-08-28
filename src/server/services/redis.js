import config from 'config';
import asyncRedis from 'async-redis';
import dayjs from 'dayjs';

import isValidTTL from '../helpers/validate-ttl.js';

const options = {
    host: config.get('redis.host'),
    port: config.get('redis.port'),
    tls: config.get('redis.tls'),
};

if (config.get('redis.user', null) && config.get('redis.password', null)) {
    Object.assign(options, {
        user: config.get('redis.user', null),
        password: config.get('redis.password', null),
    });
}

const client = asyncRedis.createClient(options);

client.on('error', (error) => console.error(error));

const DEFAULT_EXPIRE = 60 * 60 * 24; // One day
const DEFAULT_RATE_LIMIT_EXPIRE = 60; // 1 minute
const DEFAULT_RATE_LIMIT_QTY = 100;

export async function createSecret(data, ttl) {
    const key = `secret:${data.id}`;
    const prepare = [key, 'secret', data.secret];

    if (data.title) {
        prepare.push(...['title', data.title]);
    }

    if (data.password) {
        prepare.push(...['password', data.password]);
    }

    if (data.allowedIp) {
        prepare.push(...['allowed_ip', data.allowedIp]);
    }

    if (data.file) {
        prepare.push(...['file', JSON.stringify(data.file)]);
    }

    if (data.preventBurn) {
        prepare.push(...['preventBurn', true]);
    }

    if (data.maxViews) {
        prepare.push(...['maxViews', data.maxViews]);
    }

    createStatistics('secrets_created');

    if (isValidTTL(Number(ttl)) && Number(ttl) === 0) {
        return await client.multi().hmset(prepare).exec();
    }

    return await client
        .multi()
        .hmset(prepare)
        .expire(key, isValidTTL(Number(ttl)) ? ttl : DEFAULT_EXPIRE)
        .exec();
}

export async function getSecret(id) {
    const data = await client.hgetall(`secret:${id}`);

    return data;
}

export async function getSecretKey(id, key) {
    const data = await client.hgetall(`secret:${id}`);

    if (data && key in data) {
        return data[key];
    }

    return null;
}

export async function deleteSecret(id) {
    const secret = await getSecret(id);

    if (secret?.maxViews > 1) {
        await client.hincrby(`secret:${id}`, 'maxViews', -1);

        return Promise.resolve(false);
    }

    if (secret?.preventBurn !== 'true' && Number(secret?.maxViews) === 1) {
        await client.del(`secret:${id}`);
    }

    return Promise.resolve(!secret?.preventBurn);
}

export async function isAlive() {
    if ((await client.ping()) === 'PONG') {
        return true;
    }

    return false;
}

export async function createUser(username, email, password) {
    return await client.hmset(
        `user:${username}`,
        'username',
        username,
        'email',
        email,
        'password',
        password
    );
}

export async function updateUser(username, data = {}) {
    const update = Object.entries(data).flat();

    return await client.hmset(`user:${username}`, ...update);
}

export async function getUser(username) {
    return await client.hgetall(`user:${username}`);
}

export async function deleteUser(username) {
    return await client.del(`user:${username}`);
}

export async function createRateLimit(ip) {
    const key = `rate_limit:${ip}`;

    const increments = await new Promise((resolve, reject) => {
        client
            .multi()
            .incr(key)
            .expire(key, DEFAULT_RATE_LIMIT_EXPIRE)
            .exec((err, res) => {
                if (err) {
                    reject(err);
                }

                const [reply, _] = res;

                resolve(reply);
            });
    });

    if (increments > DEFAULT_RATE_LIMIT_QTY) {
        return true;
    }

    return false;
}

export async function createStatistics(type = '') {
    const types = ['secrets_created'];

    if (types.indexOf(type) === -1) {
        console.log(` [*] Type "${type}" not supported`);
    }

    return await client.incr(`statistics:${type}:${dayjs().format('YYYY-MM-DD')}`);
}
