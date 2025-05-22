import config from '../config';
import handleResponse from '../helpers/apiUtils.js';

/**
 * Fetches the application settings.
 * All API functions in this module that interact with the backend via `handleResponse`
 * (and use `credentials: 'include'`) return a Promise that resolves to an object 
 * with the following structure:
 * 
 * @returns {Promise<object>} An object containing:
 *   - `data` (any | null): 
 *       - On success (HTTP 2xx status from server): Contains the parsed JSON response.
 *       - On failure (HTTP non-2xx or network error): null.
 *   - `error` (object | string | null):
 *       - On success: null.
 *       - On failure: An error message, a parsed JSON error object from the server, 
 *         or a generic error object for network issues.
 *   - `statusCode` (number):
 *       - The HTTP status code from the server (e.g., 200, 401, 500).
 *       - `0` if a network error or other client-side error occurred before an HTTP response.
 */
export const getSettings = async () => {
    try {
        const response = await fetch(`${config.get('api.host')}/admin/settings`, {
            method: 'GET',
            cache: 'no-cache',
            credentials: 'include', // Crucial: Preserving this option
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('getSettings API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};

export const updateSettings = async (data) => {
    try {
        const response = await fetch(`${config.get('api.host')}/admin/settings`, {
            method: 'PUT',
            cache: 'no-cache',
            credentials: 'include', // Crucial: Preserving this option
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('updateSettings API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};
