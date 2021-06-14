import config from '../config';

export const createSecret = async (text, password, ttl) => {
    const data = await fetch(`${config.get('api.host')}/secret`, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, password, ttl }),
    });

    return await data.json();
};

export const getSecret = async (secretId, password) => {
    const data = await fetch(`${config.get('api.host')}/secret/${secretId}`, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
    });

    if (data.status === 401) {
        return {
            statusCode: 401,
        };
    }

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
