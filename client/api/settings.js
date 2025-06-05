import config from '../config';

export const getSettings = async () => {
    try {
        const data = await fetch(`${config.get('api.host')}/admin/settings`, {
            method: 'GET',
            cache: 'no-cache',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const json = await data.json();

        if (!data.ok) {
            return {
                statusCode: data.status,
                error: json.error || 'Failed to fetch settings',
            };
        }

        return json;
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return {
            statusCode: 500,
            error: 'Failed to fetch settings',
        };
    }
};

export const updateSettings = async (data) => {
    try {
        const response = await fetch(`${config.get('api.host')}/admin/settings`, {
            method: 'PUT',
            cache: 'no-cache',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const json = await response.json();

        if (!response.ok) {
            return {
                statusCode: response.status,
                error: json.error || 'Failed to update settings',
            };
        }

        return json;
    } catch (error) {
        console.error('Failed to update settings:', error);
        return {
            statusCode: 500,
            error: 'Failed to update settings',
        };
    }
};
