import config from '../config';

/**
 * Processes a Fetch API Response object to standardize the output.
 * 
 * @param {Response} response - The Response object from a fetch call.
 * @returns {Promise<object>} A promise that resolves to an object with the structure:
 *                            { data: any|null, error: object|string|null, statusCode: number }.
 *                            - `data`: Contains the parsed JSON response if the request was successful 
 *                                     and JSON parsing succeeded; otherwise, null.
 *                            - `error`: Contains an error message or object if the request failed 
 *                                     (HTTP error or JSON parsing error on success); otherwise, null.
 *                            - `statusCode`: The HTTP status code from the server.
 * 
 * This function checks `response.ok` to determine if the HTTP status is in the 2xx range.
 * 
 * If `response.ok` is true (successful HTTP response):
 *   - It attempts to parse the response body as JSON.
 *   - If JSON parsing succeeds, `data` is the parsed object, `error` is null.
 *   - If JSON parsing fails (and it's not a 204 No Content response), `data` is null, 
 *     and `error` contains a message about the parsing failure.
 * 
 * If `response.ok` is false (HTTP error response, e.g., 4xx or 5xx):
 *   - It attempts to parse the response body as JSON (as error responses often contain JSON details).
 *   - If JSON parsing succeeds, `error` is the parsed error object from the response.
 *   - If JSON parsing fails or the body is empty, `error` will be a generic object like 
 *     `{ message: "HTTP error STATUS_CODE" }`.
 *   - `data` is always null for HTTP error responses.
 */
const handleResponse = async (response) => {
    let responseBody;
    try {
        responseBody = await response.json();
    } catch (e) {
        // If JSON parsing fails, responseBody will be undefined
    }

    if (response.ok) {
        if (responseBody === undefined && response.status !== 204) { // 204 No Content is a valid success with no body
             return { data: null, error: 'Failed to parse JSON response.', statusCode: response.status };
        }
        return { data: responseBody, error: null, statusCode: response.status };
    } else {
        // For errors, responseBody might be undefined if parsing failed or body was empty.
        // Use responseBody if available, otherwise a generic error message.
        const errorMessage = responseBody || { message: `HTTP error ${response.status}` };
        return { data: null, error: errorMessage, statusCode: response.status };
    }
};

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
