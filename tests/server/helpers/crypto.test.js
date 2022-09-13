import assert from 'assert';

import { encrypt, decrypt, generateKey } from '../../../src/shared/helpers/crypto.js';

const SECRET = 'MASTER_KEY=1337-super-secret';

const RANDOM_KEY = generateKey();

describe('Crypto', () => {
    describe('#encrypt(string)', () => {
        it('should encrypt, and decrypt a secret', async () => {
            const encrypted = await encrypt(SECRET, RANDOM_KEY);
            const decrypted = await decrypt(encrypted, RANDOM_KEY);

            assert.equal(decrypted, SECRET);
        });
    });
});
