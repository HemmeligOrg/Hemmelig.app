const config = require('config');
const asyncRedis = require('async-redis');
const dayjs = require('dayjs');
const { nanoid } = require('nanoid');

const isValidTTL = require('../helpers/validate-ttl');

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

function createSecret(data, ttl) {
    const key = `secret:${data.id}`;
    const prepare = [key, 'secret', data.secret];

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

    createStatistics('secrets_created');

    client
        .multi()
        .hmset(prepare)
        .expire(key, isValidTTL(Number(ttl)) ? ttl : DEFAULT_EXPIRE)
        .exec();
}

async function getSecret(id) {
    const data = await client.hgetall(`secret:${id}`);

    return data;
}

async function getSecretKey(id, key) {
    const data = await client.hgetall(`secret:${id}`);

    if (data && key in data) {
        return data[key];
    }

    return null;
}

async function deleteSecret(id) {
    const preventBurn = (await getSecretKey(id, 'preventBurn')) === 'true';

    if (!preventBurn) {
        await client.del(`secret:${id}`);
    }

    return Promise.resolve(!preventBurn);
}

async function isAlive() {
    if ((await client.ping()) === 'PONG') {
        return true;
    }

    return false;
}

async function createUser(username, email, password) {
    return await client.hmset(
        `user:${username}`,
        'username',
        username,
        'email',
        email,
        'password',
        password,
        'basic_auth_token',
        nanoid()
    );
}

async function getUser(username) {
    return await client.hgetall(`user:${username}`);
}

async function deleteUser(username) {
    return await client.del(`user:${username}`);
}

async function createRateLimit(ip) {
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

async function createStatistics(type = '') {
    const types = ['secrets_created'];

    if (types.indexOf(type) === -1) {
        console.log(` [*] Type "${type}" not supported`);
    }

    return await client.incr(`statistics:${type}:${dayjs().format('YYYY-MM-DD')}`);
}

module.exports = {
    createSecret,
    getSecret,
    getSecretKey,
    deleteSecret,
    isAlive,
    createUser,
    getUser,
    deleteUser,
    createRateLimit,
    createStatistics,
};
