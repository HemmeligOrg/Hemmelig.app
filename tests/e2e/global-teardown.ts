import { existsSync, unlinkSync } from 'fs';

const TEST_DB_PATH = './database/hemmelig-test.db';

async function globalTeardown() {
    // Delete test database after tests complete
    if (existsSync(TEST_DB_PATH)) {
        unlinkSync(TEST_DB_PATH);
        console.log('Cleaned up test database');
    }

    // Also clean up journal file if it exists
    const journalPath = `${TEST_DB_PATH}-journal`;
    if (existsSync(journalPath)) {
        unlinkSync(journalPath);
    }
}

export default globalTeardown;
