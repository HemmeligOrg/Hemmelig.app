const config = require('config');
const redis = require('redis');
const { promisify } = require('util');

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

function redisCommands() {
    function createSecret(data, ttl) {
        const key = data.id;

        client.hmset(key, 'secret', data.secret, 'password', data.password);

        client.expire(key, isValidTTL(Number(ttl)) ? ttl : DEFAULT_EXPIRE);
    }

    async function getSecret(id) {
        const data = await hgetallAsync(id);

        return data;
    }

    async function deleteSecret(id) {
        await deleteAsync(id);
    }

    return {
        createSecret,
        getSecret,
        deleteSecret,
    };
}

module.exports = redisCommands();
