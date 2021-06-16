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
