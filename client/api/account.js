import config from '../config';
import handleResponse from '../helpers/apiUtils.js';

/**
 * Fetches the current user's account data.
 * All API functions in this module that interact with the backend via `handleResponse`
 * return a Promise that resolves to an object with the following structure:
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
export const getUser = async () => {
    try {
        const response = await fetch(`${config.get('api.host')}/account/`, {
            method: 'GET',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('getUser API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};

export const deleteUser = async () => {
    try {
        const response = await fetch(`${config.get('api.host')}/account/delete`, {
            method: 'POST',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'delete me', // Preserving original body
            }),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('deleteUser API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};

export const updateUser = async (data) => {
    try {
        const response = await fetch(`${config.get('api.host')}/account/update`, {
            method: 'PUT',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            // Preserving original logic for body: spread `data` and add `generated: false`
            body: JSON.stringify({ ...data, generated: false }), 
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('updateUser API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};
