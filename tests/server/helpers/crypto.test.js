const assert = require('assert');

const { encrypt, decrypt } = require('../../../src/server/helpers/crypto');

const SECRET = 'MASTER_KEY=1337-super-secret';

const RANDOM_KEY = '321312312312312312312312312';

describe('Crypto', () => {
    describe('#encrypt(string)', () => {
        it('should encrypt, and decrypt a secret', async () => {
            const encrypted = await encrypt(SECRET, RANDOM_KEY);

            assert.equal('iv' in encrypted, true);
            assert.equal('content' in encrypted, true);

            const decrypted = await decrypt(encrypted, RANDOM_KEY);

            assert.equal(decrypted, SECRET);
        });
    });
});
