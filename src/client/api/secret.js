import config from '../config';

export const createSecret = async (formData = {}, token = '') => {
    const options = {
        method: 'POST',
        cache: 'no-cache',
        body: JSON.stringify(formData),
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (token) {
        options.headers.authorization = `Bearer ${token}`;
    }
    try {
        const data = await fetch(`${config.get('api.host')}/secret`, options);
        const json = await data.json();

        return { ...json, statusCode: data.status };
    } catch (e) {
        console.error(e);
    }
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
