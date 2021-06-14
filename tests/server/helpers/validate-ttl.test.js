const assert = require('assert');

const isValidTTL = require('../../../src/server/helpers/validate-ttl');

describe('Validate TTL', () => {
    describe('#isValidTTL(ttl)', () => {
        it('should validate x seconds to be true', async () => {
            assert.equal(isValidTTL(300), true);
            assert.equal(isValidTTL(14400), true);
            assert.equal(isValidTTL(604800), true);
        });

        it('should validate x seconds to be false', async () => {
            assert.equal(isValidTTL(301), false);
            assert.equal(isValidTTL(14401), false);
            assert.equal(isValidTTL(604801), false);
        });
    });
});
