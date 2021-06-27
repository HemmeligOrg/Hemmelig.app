import config from '../config';

export const createSecret = async (text, { file, password, ttl, allowedIp }) => {
    const data = await fetch(`${config.get('api.host')}/secret`, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        body: JSON.stringify({ text, file, password, ttl, allowedIp }),
    });

    const json = await data.json();

    return await { ...json, statusCode: data.status };
};

export const getSecret = async (secretId, encryptionKey, password) => {
    const data = await fetch(`${config.get('api.host')}/secret/${secretId}`, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, encryptionKey }),
    });

    if (data.status === 401) {
        return {
            statusCode: 401,
        };
    }

    return await data.json();
};

export const burnSecret = async (secretId) => {
    const data = await fetch(`${config.get('api.host')}/secret/${secretId}/burn`);

    return await data.json();
};

export const secretExists = async (secretId) => {
    const data = await fetch(`${config.get('api.host')}/secret/${secretId}/exist`);

    if (data.status === 401) {
        return {
            statusCode: 401,
        };
    }

    return await data.json();
};
