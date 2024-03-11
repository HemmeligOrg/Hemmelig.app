import config from '../config';

export const getUser = async () => {
    const data = await fetch(`${config.get('api.host')}/account/`, {
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

export const deleteUser = async () => {
    const data = await fetch(`${config.get('api.host')}/account/delete`, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'delete me',
        }),
    });

    if (data.status === 401) {
        return {
            statusCode: 401,
        };
    }

    return data.json();
};

export const updateUser = async (data) => {
    const response = await fetch(`${config.get('api.host')}/account/update`, {
        method: 'PUT',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, generated: false }),
    });

    const json = await response.json();

    if (response.status === 401 && !json.type) {
        return {
            statusCode: response.status,
        };
    }

    return json;
};
