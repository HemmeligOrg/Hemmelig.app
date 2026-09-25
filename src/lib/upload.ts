/** A file that the server stored. Attach it to a secret with `{ id, token }`. */
export interface UploadedFile {
    id: string;
    token: string;
}

/**
 * Uploads an encrypted file as a raw request body. The server streams the body
 * to disk, so a large file does not use server memory. The browser sends the
 * encrypted file name in a header.
 * @param encrypted The encrypted file bytes from `encryptFile`.
 * @param encryptedName The hex-encoded encrypted file name.
 */
export async function uploadEncryptedFile(
    encrypted: Uint8Array,
    encryptedName: string
): Promise<UploadedFile> {
    // Send the exact bytes of the view. A copy is only needed when the view
    // does not cover its whole buffer.
    const body =
        encrypted.byteOffset === 0 && encrypted.byteLength === encrypted.buffer.byteLength
            ? (encrypted.buffer as ArrayBuffer)
            : (encrypted.slice().buffer as ArrayBuffer);

    const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/octet-stream',
            'X-Hemmelig-File-Name': encryptedName,
        },
        body,
        credentials: 'same-origin',
    });

    const data: { id?: string; token?: string; error?: string } = await response
        .json()
        .catch(() => ({}));

    if (!response.ok || !data.id || !data.token) {
        throw new Error(data.error || `File upload failed with status ${response.status}`);
    }

    return { id: data.id, token: data.token };
}
