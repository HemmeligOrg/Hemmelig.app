import config from '../config';

export const signIn = async (username, password) => {
    const data = await fetch(`${config.get('api.host')}/authentication/signin`, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (data.status === 401) {
        return {
            statusCode: 401,
        };
    }

    return await data.json();
};

export const signUp = async (email, username, password) => {
    const data = await fetch(`${config.get('api.host')}/authentication/signup`, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
    });

    return await data.json();
};

export const verify = async (token) => {
    const data = await fetch(`${config.get('api.host')}/authentication/verify`, {
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
