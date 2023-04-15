import config from '../config';

export const createSecret = async (formData = {}) => {
    const options = {
        method: 'POST',
        cache: 'no-cache',
        body: JSON.stringify(formData),
        headers: {
            'Content-Type': 'application/json',
        },
    };

    try {
        const data = await fetch(`${config.get('api.host')}/secret`, options);
        const json = await data.json();

        return { ...json, statusCode: data.status };
    } catch (error) {
        console.error(error);

        return { error: 'Failed to create your secret' };
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

    return data.json();
};

export const getSecrets = async () => {
    const data = await fetch(`${config.get('api.host')}/secret/`, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (data.status === 401) {
        return {
            statusCode: 401,
        };
    }

    return data.json();
};

export const burnSecret = async (secretId) => {
    const data = await fetch(`${config.get('api.host')}/secret/${secretId}/burn`, {
        method: 'POST',
        cache: 'no-cache',
    });

    return data.json();
};

export const secretExists = async (secretId) => {
    const data = await fetch(`${config.get('api.host')}/secret/${secretId}/exist`);

    if (data.status === 401) {
        return {
            statusCode: 401,
        };
    }

    return data.json();
};
