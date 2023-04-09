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

    const json = await data.json();

    if (data.status === 403) {
        return {
            statusCode: 403,
            error: json.error,
        };
    }

    return json;
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

    const json = await data.json();

    if (data.status === 403) {
        return {
            statusCode: 403,
            error: json.error,
        };
    }

    return json;
};

export const signOut = async () => {
    const data = await fetch(`${config.get('api.host')}/authentication/signout`, {
        method: 'POST',
        cache: 'no-cache',
    });

    return data.json();
};

export const verify = async () => {
    const data = await fetch(`${config.get('api.host')}/authentication/verify`, {
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
