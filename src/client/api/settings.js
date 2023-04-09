import config from '../config';

export const getSettings = async () => {
    const data = await fetch(`${config.get('api.host')}/admin/settings`, {
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

export const updateSettings = async (data) => {
    const response = await fetch(`${config.get('api.host')}/admin/settings`, {
        method: 'PUT',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const json = await response.json();

    if ([401, 403].includes(response.status) && !json.type) {
        return {
            statusCode: response.status,
            error: json.error,
        };
    }

    return json;
};
