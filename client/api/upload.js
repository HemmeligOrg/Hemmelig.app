import tweetnaclUtil from 'tweetnacl-util';
import { decrypt } from '../../shared/helpers/crypto';
import config from '../config';
import handleResponse from '../helpers/apiUtils.js'; // Added import

const { decodeBase64 } = tweetnaclUtil;

/**
 * Downloads a file after fetching its content and decrypting it.
 * 
 * @param {object} fileData - Object containing file details ({ key, ext, type }), 
 *                            secretId, and decryptionKey.
 * @returns {Promise<object>} A promise that resolves to an object indicating outcome:
 *   - On successful fetch, decryption, and download initiation: `{ success: true }`.
 *   - On failure (API error, decryption error, DOM error, etc.): 
 *     `{ success: false, error: <errorDetails>, statusCode: <httpOrErrorCode> }`.
 *     The `error` field will contain details about the failure (e.g., an error message 
 *     or an error object from the server), and `statusCode` will reflect the HTTP status 
 *     from the server, or `0` for client-side issues like decryption or DOM errors.
 */
export const downloadFile = async (fileData) => {
    const { file, secretId, decryptionKey } = fileData;
    const { key, ext, type } = file; // Destructure ext and type for use in download logic

    try {
        const response = await fetch(`${config.get('api.host')}/download/`, {
            method: 'POST',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ key, secretId }),
        });

        const apiResponse = await handleResponse(response);

        if (apiResponse.error) {
            console.error('downloadFile API error:', apiResponse.error);
            return { success: false, error: apiResponse.error, statusCode: apiResponse.statusCode };
        }

        if (apiResponse.data) {
            try {
                // Proceed with decryption and file download logic
                const fileContent = decodeBase64(decrypt(apiResponse.data.content, decryptionKey));
                
                const a = document.createElement('a');
                const blob = new Blob([fileContent], { type: type }); // Use 'type' from fileData.file.type
                const url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = 'hemmelig_files' + ext; // Use 'ext' from fileData.file.ext
                a.click();
                window.URL.revokeObjectURL(url);
                
                return { success: true };
            } catch (decryptionOrDOMError) {
                // Handle errors during decryption or DOM manipulation
                console.error('Error during file processing or download:', decryptionOrDOMError);
                return { success: false, error: decryptionOrDOMError.message || 'File processing error', statusCode: 0 }; // Or a more specific error code
            }
        }
        
        // Fallback for unexpected apiResponse structure, though handleResponse should prevent this
        console.error('downloadFile unexpected apiResponse structure:', apiResponse);
        return { success: false, error: 'Unexpected API response structure', statusCode: apiResponse.statusCode || 0 };

    } catch (error) {
        // Catches errors from fetch, handleResponse, or other synchronous code in the try block
        console.error('Unexpected error in downloadFile:', error);
        return { success: false, error: error.message || 'Unexpected error', statusCode: 0 };
    }
};
