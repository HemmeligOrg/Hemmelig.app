import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';

/**
 * Valid expiration times in seconds
 */
export const EXPIRATION_TIMES = {
    '5m': 300,
    '30m': 1800,
    '1h': 3600,
    '4h': 14400,
    '12h': 43200,
    '1d': 86400,
    '3d': 259200,
    '7d': 604800,
    '14d': 1209600,
    '28d': 2419200,
} as const;

export type ExpirationKey = keyof typeof EXPIRATION_TIMES;

/**
 * Options for creating a secret
 */
export interface SecretOptions {
    /** The secret content to encrypt */
    secret: string;
    /** Optional title for the secret */
    title?: string;
    /** Optional password protection */
    password?: string;
    /** Expiration time (default: '1d') */
    expiresIn?: ExpirationKey;
    /** Maximum number of views (default: 1, max: 9999) */
    views?: number;
    /** Whether to burn after first view (default: true) */
    burnable?: boolean;
    /** Base URL of the Hemmelig instance (default: 'https://hemmelig.app') */
    baseUrl?: string;
}

/**
 * Result from creating a secret
 */
export interface CreateSecretResult {
    /** The full URL to access the secret */
    url: string;
    /** The secret ID */
    id: string;
    /** The expiration time that was set */
    expiresIn: string;
}

/**
 * Generates a random 32-character string using URL-safe base64 encoding
 */
function generateKey(): string {
    return randomBytes(24).toString('base64url').slice(0, 32);
}

/**
 * Generates a random 32-character salt
 */
function generateSalt(): string {
    return randomBytes(24).toString('base64url').slice(0, 32);
}

/**
 * Derives a 256-bit AES key using PBKDF2-SHA256
 */
function deriveKey(password: string, salt: string): Buffer {
    return pbkdf2Sync(password, salt, 1300000, 32, 'sha256');
}

/**
 * Encrypts data using AES-256-GCM
 * Returns IV (12 bytes) + ciphertext + auth tag (16 bytes)
 */
function encrypt(data: Buffer, encryptionKey: string, salt: string): Uint8Array {
    const key = deriveKey(encryptionKey, salt);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Format: IV (12 bytes) + ciphertext + authTag (16 bytes)
    const fullMessage = new Uint8Array(iv.length + encrypted.length + authTag.length);
    fullMessage.set(iv, 0);
    fullMessage.set(encrypted, iv.length);
    fullMessage.set(authTag, iv.length + encrypted.length);

    return fullMessage;
}

/**
 * Encrypts text using AES-256-GCM
 */
function encryptText(text: string, encryptionKey: string, salt: string): Uint8Array {
    return encrypt(Buffer.from(text, 'utf8'), encryptionKey, salt);
}

/**
 * Converts Uint8Array to a JSON-serializable object format
 * This matches the format expected by the API's jsonToUint8ArraySchema
 */
function uint8ArrayToObject(arr: Uint8Array): Record<string, number> {
    const obj: Record<string, number> = {};
    for (let i = 0; i < arr.length; i++) {
        obj[i.toString()] = arr[i];
    }
    return obj;
}

/**
 * Creates an encrypted secret on a Hemmelig server
 *
 * @example
 * ```typescript
 * import { createSecret } from 'hemmelig';
 *
 * const result = await createSecret({
 *   secret: 'my secret message',
 *   title: 'API Key',
 *   expiresIn: '1h',
 *   views: 1
 * });
 *
 * console.log(result.url); // https://hemmelig.app/secret/abc123#decryptionKey=...
 * ```
 */
export async function createSecret(options: SecretOptions): Promise<CreateSecretResult> {
    const {
        secret,
        title,
        password,
        expiresIn = '1d',
        views = 1,
        burnable = true,
        baseUrl = 'https://hemmelig.app',
    } = options;

    // Validate expiration time
    if (!(expiresIn in EXPIRATION_TIMES)) {
        throw new Error(
            `Invalid expiration time "${expiresIn}". Valid options: ${Object.keys(EXPIRATION_TIMES).join(', ')}`
        );
    }

    // Validate views
    if (views < 1 || views > 9999) {
        throw new Error('Views must be between 1 and 9999');
    }

    // Generate encryption key and salt
    const encryptionKey = password || generateKey();
    const salt = generateSalt();

    // Encrypt the secret (and title if provided)
    const encryptedSecret = encryptText(secret, encryptionKey, salt);
    const encryptedTitle = title ? encryptText(title, encryptionKey, salt) : null;

    // Prepare the request payload
    const payload: Record<string, unknown> = {
        secret: uint8ArrayToObject(encryptedSecret),
        salt,
        expiresAt: EXPIRATION_TIMES[expiresIn],
        views,
        isBurnable: burnable,
    };

    if (encryptedTitle) {
        payload.title = uint8ArrayToObject(encryptedTitle);
    }

    // If password is provided, send it for server-side hashing
    // Otherwise, leave it empty (key will be in URL fragment)
    if (password) {
        payload.password = password;
    }

    // Make the API request
    const response = await fetch(`${baseUrl}/api/secrets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = (await response.json().catch(() => ({ error: 'Unknown error' }))) as {
            error?: string;
        };
        throw new Error(`Failed to create secret: ${errorData.error || response.statusText}`);
    }

    const data = (await response.json()) as { id: string };

    // Construct the URL
    // If no password was provided, include the decryption key in the URL fragment
    const url = password
        ? `${baseUrl}/secret/${data.id}`
        : `${baseUrl}/secret/${data.id}#decryptionKey=${encryptionKey}`;

    return {
        url,
        id: data.id,
        expiresIn,
    };
}
