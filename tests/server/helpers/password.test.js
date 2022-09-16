import assert from 'assert';

import { hash, compare } from '../../../src/server/helpers/password.js';

const PASSWORD = 'suP3rL0ng!PssWrd';

describe('Password', () => {
    describe('#hash(password), #compare(password, hash)', () => {
        it('should hash as password, then compare it to be true', async () => {
            const hashedPassword = await hash(PASSWORD);
            assert.equal(typeof hashedPassword, 'string');

            assert.equal(await compare(PASSWORD, hashedPassword), true);
        });

        it('should hash as password, then compare it to be false', async () => {
            const hashedPassword = await hash(PASSWORD);
            assert.equal(typeof hashedPassword, 'string');

            assert.equal(await compare(PASSWORD + 'wrong_password', hashedPassword), false);
        });
    });
});
