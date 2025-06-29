import bcrypt from 'bcryptjs';

// https://www.npmjs.com/package/bcrypt
/**
 * Hashes a password using bcrypt.
 * @param password The plain-text password to hash.
 * @returns A promise that resolves to the hashed password.
 * @throws Will throw an error if hashing fails.
 */
export async function hash(password: string): Promise<string> {
    try {
        // salt rounds: https://www.npmjs.com/package/bcrypt#a-note-on-rounds
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    } catch (error) {
        console.error('Error during password hashing:', error);
        throw new Error('Error hashing the password.');
    }
}

/**
 * Compares a plain-text password with a hash.
 * @param password The plain-text password to compare.
 * @param hash The hash to compare against.
 * @returns A promise that resolves to true if the password matches the hash, otherwise false.
 */
export async function compare(password: string, hash: string): Promise<boolean> {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        console.error('Error during password comparison:', error);
        // In case of an error, return false as a safe default.
        return Promise.resolve(false);
    }
}
