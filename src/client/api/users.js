import config from '../config';

export const getUsers = async (skip = 0) => {
    const data = await fetch(`${config.get('api.host')}/admin/users?skip=${skip}`, {
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

const userFetchTemplate = async (data, method = 'GET') => {
    const response = await fetch(`${config.get('api.host')}/admin/users`, {
        method,
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const json = await response.json();

    if ([401, 403, 409, 500].includes(response.status)) {
        return {
            statusCode: response.status,
            error: json.error,
            type: json?.type,
        };
    }

    return json;
};

export const updateUser = async (data) => {
    return userFetchTemplate(data, 'PUT');
};

export const addUser = async (data) => {
    return userFetchTemplate(data, 'POST');
};

export const deleteUser = async (data) => {
    return userFetchTemplate(data, 'DELETE');
};
