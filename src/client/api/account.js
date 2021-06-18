import config from '../config';

export const getUser = async (token) => {
    const data = await fetch(`${config.get('api.host')}/account/`, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (data.status === 401) {
        return {
            statusCode: 401,
        };
    }

    return await data.json();
};
