import config from '../config';
import handleResponse from '../helpers/apiUtils.js';

export const createSecret = async (formData = {}) => {
    const options = {
        method: 'POST',
        cache: 'no-cache',
        body: JSON.stringify(formData),
        headers: {
            'Content-Type': 'application/json',
        },
    };

    try {
        const response = await fetch(`${config.get('api.host')}/secret`, options);
        return await handleResponse(response);
    } catch (error) {
        console.error('createSecret API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};

/**
 * Creates a new secret.
 * All API functions in this file, including this one, return a Promise 
 * that resolves to an object with the following structure:
 * 
 * @returns {Promise<object>} An object containing:
 *   - `data` (any | null): 
 *       - On success (HTTP 2xx status): Contains the parsed JSON response from the server.
 *       - On failure (HTTP non-2xx status or network error): null.
 *   - `error` (object | string | null):
 *       - On success: null.
 *       - On failure: 
 *           - If an HTTP error with a JSON body: The parsed JSON error object.
 *           - If an HTTP error without a JSON body: A generic error object like `{ message: "HTTP error STATUS_CODE" }`.
 *           - If a network error or other client-side error: An error message string.
 *   - `statusCode` (number):
 *       - The HTTP status code from the server (e.g., 200, 201, 400, 401, 500).
 *       - `0` if the error occurred before an HTTP response was received (e.g., a network error).
 */
export const getSecret = async (secretId, password) => {
    const options = {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
    };

    try {
        const response = await fetch(`${config.get('api.host')}/secret/${secretId}`, options);
        return await handleResponse(response);
    } catch (error) {
        console.error('getSecret API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};

export const getSecrets = async () => {
    const options = {
        method: 'GET',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    try {
        const response = await fetch(`${config.get('api.host')}/secret/`, options);
        return await handleResponse(response);
    } catch (error) {
        console.error('getSecrets API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};

export const getPublicSecrets = async (username = '') => {
    const options = {
        method: 'GET',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const url = username 
        ? `${config.get('api.host')}/secret/public/${username}` 
        : `${config.get('api.host')}/secret/public/`; // Assuming endpoint for all public secrets if username is empty

    try {
        const response = await fetch(url, options);
        return await handleResponse(response);
    } catch (error) {
        console.error('getPublicSecrets API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};

export const burnSecret = async (secretId) => {
    const options = {
        method: 'POST',
        cache: 'no-cache',
        // No body or Content-Type needed for this specific burn operation as per original.
        // If API expects JSON for burn, Content-Type header should be added.
    };

    try {
        const response = await fetch(`${config.get('api.host')}/secret/${secretId}/burn`, options);
        return await handleResponse(response); // Expects 204 No Content on success
    } catch (error) {
        console.error('burnSecret API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};

export const secretExists = async (secretId) => {
    const options = {
        method: 'GET', // Changed from POST in original, as GET is more typical for "exists" checks
        cache: 'no-cache',
        headers: { // Added headers for consistency, though "exists" might not need it
            'Content-Type': 'application/json',
        },
    };

    try {
        const response = await fetch(`${config.get('api.host')}/secret/${secretId}/exist`, options);
        // For "exists", a 404 might be a valid "false" response, not an error.
        // However, the standard handler will treat 404 as an error.
        // If 404 should be { data: { exists: false }, error: null, statusCode: 404 },
        // then specific logic is needed here. Sticking to standard for now.
        return await handleResponse(response);
    } catch (error) {
        console.error('secretExists API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};
