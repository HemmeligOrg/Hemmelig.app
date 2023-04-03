import config from 'config';
import asyncRedis from 'async-redis';
import dayjs from 'dayjs';

import isValidTTL from '../helpers/validate-ttl.js';

const options = {
    host: config.get('redis.host'),
    port: config.get('redis.port'),
    tls: config.get('redis.tls'),
};

if (config.get('redis.password', null)) {
    Object.assign(options, {
        user: config.get('redis.user', null),
        password: config.get('redis.password', null),
    });
}

const client = asyncRedis.createClient(options);

client.on('error', (error) => console.error(error));

const DEFAULT_EXPIRE = 60 * 60 * 24; // One day

const STATISTIC_TYPES = ['secrets_created'];

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

    if (data.files) {
        prepare.push(...['files', JSON.stringify(data.files)]);
    }

    if (data.preventBurn) {
        prepare.push(...['preventBurn', true]);
    }

    if (data.maxViews) {
        prepare.push(...['maxViews', data.maxViews]);
    }

    createStatistics('secrets_created');

    if (isValidTTL(Number(ttl)) && Number(ttl) === 0) {
        return client.multi().hmset(prepare).exec();
    }

    return client
        .multi()
        .hmset(prepare)
        .expire(key, isValidTTL(Number(ttl)) ? ttl : DEFAULT_EXPIRE)
        .exec();
}

export async function getSecret(id) {
    return client.hgetall(`secret:${id}`);
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

export async function keyExists(key) {
    return client.exists(key);
}

export async function isAlive() {
    return (await client.ping()) === 'PONG';
}

export async function createUser(username, email, password) {
    return client.hmset(
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

    return client.hmset(`user:${username}`, ...update);
}

export async function getUser(username) {
    return client.hgetall(`user:${username}`);
}

export async function getAllUsers() {
    const usernames = await getAllUserNames();
    return Promise.all(usernames.map(async (username) => await client.hgetall(`user:${username}`)));
}

export async function getAllUserNames() {
    const keys = await client.keys('user:*');
    return keys.map((key) => key.split(':')[1]);
}

export async function deleteUser(username) {
    return client.del(`user:${username}`);
}

export async function createStatistics(type = '') {
    if (STATISTIC_TYPES.indexOf(type) === -1) {
        console.log(` [*] Type "${type}" not supported`);
    }

    const current = `statistics:${type}`;

    const hasDate = await client.hget(current, dayjs().format('YYYY-MM-DD'));

    if (!hasDate) {
        return client.hmset(current, dayjs().format('YYYY-MM-DD'), 1);
    }

    return client.hincrby(current, dayjs().format('YYYY-MM-DD'), 1);
}

export async function getStatistics(type = '') {
    if (STATISTIC_TYPES.indexOf(type) === -1) {
        console.log(` [*] Type "${type}" not supported`);
    }

    const current = `statistics:${type}`;

    return client.hgetall(current);
}
