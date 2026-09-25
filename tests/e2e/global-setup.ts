import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB_PATH = './database/hemmelig-test.db';

export const TEST_USER = {
    email: 'e2e-test@hemmelig.local',
    username: 'e2etestuser',
    password: 'E2ETestPassword123!',
    name: 'E2E Test User',
};

async function globalSetup(config: FullConfig) {
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:5173';

    // Delete existing test database to start fresh
    if (existsSync(TEST_DB_PATH)) {
        unlinkSync(TEST_DB_PATH);
        console.log('Deleted existing test database');
    }

    // Run migrations on test database
    console.log('Running migrations on test database...');
    execSync('npx prisma migrate deploy', {
        env: {
            ...process.env,
            DATABASE_URL: `file:${TEST_DB_PATH}`,
        },
        stdio: 'inherit',
    });

    // Wait for server to be ready
    let attempts = 0;
    while (attempts < 30) {
        try {
            const response = await fetch(`${baseURL}/api/setup/status`);
            if (response.ok) break;
        } catch {
            // Server not ready yet
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
    }

    // Check if setup is needed (should always be true with fresh DB)
    const statusResponse = await fetch(`${baseURL}/api/setup/status`);
    const statusData = await statusResponse.json();

    if (statusData.needsSetup) {
        console.log('Creating test user...');
        const setupResponse = await fetch(`${baseURL}/api/setup/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_USER.email,
                password: TEST_USER.password,
                username: TEST_USER.username,
                name: TEST_USER.name,
            }),
        });

        if (!setupResponse.ok) {
            console.error('Failed to complete setup:', await setupResponse.text());
        } else {
            console.log('Test user created successfully');
            // Change settings only on the fresh test instance that this run set up.
            // A reused development server keeps its own settings.
            await disableRateLimiting(baseURL);
        }
    }
}

/**
 * Turns off the API rate limit for the test instance. The default limit is
 * 100 requests per minute for each IP address. The suite sends more requests
 * than that from one IP, so sign-in fails in the later tests.
 */
async function disableRateLimiting(baseURL: string) {
    const signInResponse = await fetch(`${baseURL}/api/auth/sign-in/username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: baseURL },
        body: JSON.stringify({ username: TEST_USER.username, password: TEST_USER.password }),
    });
    if (!signInResponse.ok) {
        throw new Error(
            `Test user sign-in failed with status ${signInResponse.status}: ${await signInResponse.text()}`
        );
    }

    const cookie = signInResponse.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; ');
    const headers = { 'Content-Type': 'application/json', Origin: baseURL, Cookie: cookie };

    // A read creates the settings row when it does not exist yet.
    await fetch(`${baseURL}/api/instance/settings`, { headers });

    const updateResponse = await fetch(`${baseURL}/api/instance/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ enableRateLimiting: false }),
    });
    if (!updateResponse.ok) {
        throw new Error(
            `Could not turn off rate limiting: ${updateResponse.status} ${await updateResponse.text()}`
        );
    }
    console.log('Rate limiting turned off for the test instance');
}

export default globalSetup;
