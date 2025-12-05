import { nanoid } from 'nanoid';

/**
 * Returns the user-provided password or generates a random 32-character string to be used as an encryption key.
 * @param {string} [password] - The user's password. If not provided, a random key is generated.
 * @returns {string} - The password or the generated key.
 */
export const generateEncryptionKey = (password?: string): string => {
    if (password && password.length > 0) {
        return password;
    }
    return nanoid(32);
};

/**
 * Generates a random 256-bit (32-byte) salt.
 * @returns {string} A 32-character string to be used as a salt.
 */
export const generateSalt = (): string => {
    return nanoid(32);
};

/**
 * Derives a 256-bit AES-GCM key from a user-provided string (password or generated key).
 * Uses PBKDF2 for key derivation, which is more secure than simple hashing.
 * @param {string} userKeyString - The user's password or generated key string.
 * @param {string} salt - A unique identifier for the secret, used as a salt.
 * @returns {Promise<CryptoKey>} - A promise that resolves to a CryptoKey.
 */
async function getDerivedKey(userKeyString: string, salt: string): Promise<CryptoKey> {
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(userKeyString),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: new TextEncoder().encode(salt),
            iterations: 600000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts data using AES-256-GCM.
 * @param {string} text - The string data to encrypt.
 * @param {string} userEncryptionKey - The user's password or generated key string.
 * @param {string} salt - The salt to use for key derivation.
 * @returns {Promise<Uint8Array>} - A promise that resolves to the encrypted data (IV + ciphertext).
 */
export const encrypt = async (
    text: string,
    userEncryptionKey: string,
    salt: string
): Promise<Uint8Array> => {
    const key = await getDerivedKey(userEncryptionKey, salt);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const plaintext = new TextEncoder().encode(text);

    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        plaintext
    );

    const fullMessage = new Uint8Array(iv.length + ciphertext.byteLength);
    fullMessage.set(iv);
    fullMessage.set(new Uint8Array(ciphertext), iv.length);

    return fullMessage;
};

/**
 * Encrypts a file buffer using AES-256-GCM.
 * @param {ArrayBuffer} fileBuffer - The file data to encrypt.
 * @param {string} userEncryptionKey - The user's password or generated key string.
 * @param {string} salt - The salt to use for key derivation.
 * @returns {Promise<Uint8Array>} - A promise that resolves to the encrypted data (IV + ciphertext).
 */
export const encryptFile = async (
    fileBuffer: ArrayBuffer,
    userEncryptionKey: string,
    salt: string
): Promise<Uint8Array> => {
    const key = await getDerivedKey(userEncryptionKey, salt);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const plaintext = new Uint8Array(fileBuffer);

    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        plaintext
    );

    const fullMessage = new Uint8Array(iv.length + ciphertext.byteLength);
    fullMessage.set(iv);
    fullMessage.set(new Uint8Array(ciphertext), iv.length);

    return fullMessage;
};

/**
 * Decrypts data using AES-256-GCM.
 * @param {Uint8Array} fullMessage - The encrypted data (IV + ciphertext).
 * @param {string} userEncryptionKey - The user's password or generated key string.
 * @param {string} salt - The salt to use for key derivation.
 * @returns {Promise<string>} - A promise that resolves to the decrypted string data.
 */
export const decrypt = async (
    fullMessage: Uint8Array,
    userEncryptionKey: string,
    salt: string
): Promise<string> => {
    const key = await getDerivedKey(userEncryptionKey, salt);
    const iv = fullMessage.slice(0, 12);
    const ciphertext = fullMessage.slice(12);

    try {
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error('Decryption failed!', e);
        throw new Error('Could not decrypt message. The key may be wrong or the data corrupted.');
    }
};

/**
 * Decrypts a file buffer using AES-256-GCM.
 * @param {Uint8Array} fullMessage - The encrypted data (IV + ciphertext).
 * @param {string} userEncryptionKey - The user's password or generated key string.
 * @param {string} salt - The salt to use for key derivation.
 * @returns {Promise<Uint8Array>} - A promise that resolves to the decrypted file data.
 */
export const decryptFile = async (
    fullMessage: Uint8Array,
    userEncryptionKey: string,
    salt: string
): Promise<Uint8Array> => {
    const key = await getDerivedKey(userEncryptionKey, salt);
    const iv = fullMessage.slice(0, 12);
    const ciphertext = fullMessage.slice(12);

    try {
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            key,
            ciphertext
        );

        return new Uint8Array(decrypted);
    } catch (e) {
        console.error('Decryption failed!', e);
        throw new Error('Could not decrypt message. The key may be wrong or the data corrupted.');
    }
};
