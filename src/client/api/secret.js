import config from '../config';

export const createSecret = async (formData = {}, token = '') => {
    const options = {
        method: 'POST',
        cache: 'no-cache',
        body: formData,
    };

    if (token) {
        Object.assign(options, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    const data = await fetch(`${config.get('api.host')}/secret`, options);
    const json = await data.json();

    return { ...json, statusCode: data.status };
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
    const data = await fetch(`${config.get('api.host')}/secret/${secretId}/burn`, {
        method: 'POST',
        cache: 'no-cache',
    });

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
