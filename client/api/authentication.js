import config from '../config';
import handleResponse from '../helpers/apiUtils.js';

/**
 * Handles user sign-in.
 * All API functions in this module that interact with the backend via `handleResponse`
 * return a Promise that resolves to an object with the following structure:
 * 
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
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
export const signIn = async (username, password) => {
    try {
        const response = await fetch(`${config.get('api.host')}/authentication/signin`, {
            method: 'POST',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('signIn API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};

export const signUp = async (email, username, password) => {
    try {
        const response = await fetch(`${config.get('api.host')}/authentication/signup`, {
            method: 'POST',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, username, password }),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('signUp API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};

export const signOut = async () => {
    try {
        const response = await fetch(`${config.get('api.host')}/authentication/signout`, {
            method: 'POST',
            cache: 'no-cache',
            // No Content-Type or body is typically needed for a simple POST signout
        });
        return await handleResponse(response); // Expects 204 No Content or similar on success
    } catch (error) {
        console.error('signOut API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};

export const verify = async () => {
    try {
        const response = await fetch(`${config.get('api.host')}/authentication/verify`, {
            method: 'GET',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json', // Kept header, though GET might not always need it
            },
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('verify API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};

export const refresh = async () => {
    try {
        const response = await fetch(`${config.get('api.host')}/authentication/refresh`, {
            method: 'GET',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json', // Kept header
            },
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('refresh API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};
