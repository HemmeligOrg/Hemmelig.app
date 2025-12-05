import * as argon2 from 'argon2';

/**
 * Hashes a password using Argon2id.
 * Uses Bun.password if available, otherwise falls back to argon2 npm package.
 * @param password The plain-text password to hash.
 * @returns A promise that resolves to the hashed password.
 * @throws Will throw an error if hashing fails.
 */
export async function hash(password: string): Promise<string> {
    try {
        // Try Bun's native password hashing first (uses Argon2)
        if (typeof Bun !== 'undefined' && Bun.password) {
            return await Bun.password.hash(password);
        }

        // Fallback to argon2 npm package (Argon2id)
        return await argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 65536, // 64 MB
            timeCost: 3,
            parallelism: 4,
        });
    } catch (error) {
        console.error('Error during password hashing:', error);
        throw new Error('Error hashing the password.');
    }
}

/**
 * Compares a plain-text password with a hash.
 * @param password The plain-text password to compare.
 * @param storedHash The hash to compare against.
 * @returns A promise that resolves to true if the password matches the hash, otherwise false.
 */
export async function compare(password: string, storedHash: string): Promise<boolean> {
    try {
        // Try Bun's native password verification first
        if (typeof Bun !== 'undefined' && Bun.password) {
            return await Bun.password.verify(password, storedHash);
        }

        // Fallback to argon2 npm package
        return await argon2.verify(storedHash, password);
    } catch (error) {
        console.error('Error during password comparison:', error);
        return false;
    }
}
