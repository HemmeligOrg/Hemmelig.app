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
 *     `{ message: `HTTP error ${response.status}` }`.
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
        // For 204 No Content, responseBody will be undefined, which is correct.
        // If parsing failed for other successful responses, it's an error.
        if (responseBody === undefined && response.status !== 204) { 
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

export default handleResponse;
