const config = require('config');
const redis = require('redis');
const { promisify } = require('util');
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

const client = redis.createClient(options);

client.on('error', (error) => console.error(error));

const hgetallAsync = promisify(client.hgetall).bind(client);
const deleteAsync = promisify(client.del).bind(client);

const DEFAULT_EXPIRE = 60 * 60 * 24; // One day

function createSecret(data, ttl) {
    const prepare = [`secret:${data.id}`, 'secret', data.secret];

    if (data.password) {
        prepare.push(...['password', data.password]);
    }

    client.hmset(prepare);

    client.expire(key, isValidTTL(Number(ttl)) ? ttl : DEFAULT_EXPIRE);
}

async function getSecret(id) {
    const data = await hgetallAsync(`secret:${id}`);

    return data;
}

async function deleteSecret(id) {
    await deleteAsync(`secret:${id}`);
}

async function getServerInfo() {
    return await client.server_info.redis_version;
}

async function createUser(username, password) {
    return await client.hmset(
        `user:${username}`,
        'username',
        username,
        'password',
        password,
        'basic_auth_token',
        nanoid()
    );
}

async function getUser(username) {
    return await hgetallAsync(`user:${username}`);
}

async function deleteUser(username) {
    return await deleteAsync(`user:${username}`);
}

module.exports = {
    createSecret,
    getSecret,
    deleteSecret,
    getServerInfo,
    createUser,
    getUser,
    deleteUser,
};
