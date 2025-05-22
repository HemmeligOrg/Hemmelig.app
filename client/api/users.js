import config from '../config';
import handleResponse from '../helpers/apiUtils.js';

/**
 * Fetches a list of users, with optional pagination.
 * All API functions in this module that interact with the backend via `handleResponse`
 * (including those using `userFetchTemplate`) return a Promise that resolves to an object 
 * with the following structure:
 * 
 * @param {number} [skip=0] - The number of users to skip for pagination.
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
export const getUsers = async (skip = 0) => {
    try {
        const response = await fetch(`${config.get('api.host')}/admin/users?skip=${skip}`, {
            method: 'GET',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('getUsers API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};

const userFetchTemplate = async (data, method = 'GET') => {
    try {
        const response = await fetch(`${config.get('api.host')}/admin/users`, {
            method, // Method is passed as an argument
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`userFetchTemplate API error (method: ${method}):`, error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
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
