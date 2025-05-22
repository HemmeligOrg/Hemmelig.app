import handleResponse from '../helpers/apiUtils.js';

/**
 * Tracks a page view.
 * All API functions in this module that interact with the backend via `handleResponse`
 * return a Promise that resolves to an object with the following structure:
 * 
 * @param {string} path - The path of the page viewed.
 * @returns {Promise<object>} An object containing:
 *   - `data` (any | null): 
 *       - On success (HTTP 2xx status from server): Contains the parsed JSON response 
 *         (though for trackPageView, this might be minimal or null if the server sends 204 No Content).
 *       - On failure (HTTP non-2xx or network error): null.
 *   - `error` (object | string | null):
 *       - On success: null.
 *       - On failure: An error message, a parsed JSON error object from the server, 
 *         or a generic error object for network issues.
 *   - `statusCode` (number):
 *       - The HTTP status code from the server (e.g., 200, 204, 400, 500).
 *       - `0` if a network error or other client-side error occurred before an HTTP response.
 */
const trackPageView = async (path) => {
    try {
        const response = await fetch('/api/analytics/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path,
            }),
        });
        return await handleResponse(response); // trackPageView will now return the standard object
    } catch (error) {
        console.error('trackPageView API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};

const getAnalyticsData = async () => {
    try {
        const response = await fetch('/api/analytics/data/aggregate/daily', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('getAnalyticsData API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};

const getStatistics = async () => {
    try {
        const response = await fetch('/api/stats', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('getStatistics API error:', error);
        return { data: null, error: error.message || 'Network error', statusCode: 0 };
    }
};

export { getAnalyticsData, getStatistics, trackPageView };
