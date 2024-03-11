import bcrypt from 'bcryptjs';

// https://www.npmjs.com/package/bcrypt
export async function hash(password) {
    try {
        // salt rounds https://www.npmjs.com/package/bcrypt#user-content-a-note-on-rounds
        return await bcrypt.hash(password, 10);
    } catch (error) {
        console.error(error);

        throw new Error('Error hashing the password');
    }
}

export async function compare(password, hash) {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        console.error(error);

        return false;
    }
}
