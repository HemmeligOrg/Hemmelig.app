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
        }
    }
}

export default globalSetup;
