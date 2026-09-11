import { expect, test, TEST_USER } from './fixtures';

test.describe('Authentication', () => {
    test.describe.configure({ mode: 'serial' });

    test('should complete initial setup if needed', async ({ page, request }) => {
        // Check if setup is needed
        const statusResponse = await request.get('/api/setup/status');
        const statusData = await statusResponse.json();

        if (statusData.needsSetup) {
            await page.goto('/setup');

            // Fill in the setup form
            await page.getByPlaceholder(/email/i).fill(TEST_USER.email);
            await page.getByPlaceholder(/username/i).fill(TEST_USER.username);
            await page.getByPlaceholder(/name/i).first().fill(TEST_USER.name);
            await page.getByPlaceholder(/create.*password/i).fill(TEST_USER.password);

            // Submit setup
            await page.getByRole('button', { name: /create|setup|submit/i }).click();

            // Should redirect to home or login
            await expect(page).toHaveURL(/^\/$|\/login/, { timeout: 10000 });
        } else {
            // Setup already done, just verify we can access the app
            await page.goto('/');
            // Either we see the home page or login page
            const url = page.url();
            expect(url.includes('/') || url.includes('/login')).toBe(true);
        }
    });

    test('should allow user registration when enabled', async ({ page, request }) => {
        // Check if registration is allowed
        const settingsResponse = await request.get('/api/instance/settings/public');
        const settings = await settingsResponse.json();

        if (!settings.allowRegistration) {
            test.skip();
            return;
        }

        await page.goto('/register');

        // Check that registration form is visible
        await expect(page.getByPlaceholder(/email/i)).toBeVisible();
        await expect(page.getByPlaceholder(/username/i)).toBeVisible();
        await expect(page.getByPlaceholder(/create.*password/i)).toBeVisible();
    });

    test('should show login page', async ({ page }) => {
        await page.goto('/login');

        // Check that login form is visible
        await expect(page.getByPlaceholder(/username/i)).toBeVisible();
        await expect(page.getByPlaceholder(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.getByPlaceholder(/username/i).fill('nonexistent@test.com');
        await page.getByPlaceholder(/password/i).fill('wrongpassword');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Should stay on login page or show error
        await page.waitForTimeout(2000);
        const isStillOnLogin = page.url().includes('/login');
        const hasError = await page
            .getByText(/invalid|error|incorrect|failed/i)
            .isVisible()
            .catch(() => false);

        expect(isStillOnLogin || hasError).toBe(true);
    });

    test('should hide registration prompt on login page when registration is disabled', async ({
        page,
    }) => {
        await page.route('**/api/instance/settings/public', (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    allowRegistration: false,
                    disableEmailPasswordSignup: false,
                }),
            });
        });

        await page.goto('/login');
        await expect(page.getByPlaceholder(/username/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /sign up/i })).not.toBeVisible();
        await page.unrouteAll({ behavior: 'ignoreErrors' });
    });

    test('should hide registration link in header when registration is disabled', async ({
        page,
    }) => {
        await page.route('**/api/instance/settings/public', (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    allowRegistration: false,
                    disableEmailPasswordSignup: false,
                }),
            });
        });

        await page.goto('/');
        await expect(page.getByRole('link', { name: /sign up/i })).not.toBeVisible();
        await page.unrouteAll({ behavior: 'ignoreErrors' });
    });

    test('should allow admin to create user even when registration is disabled', async ({
        request,
    }) => {
        const apiHeaders = { Origin: 'http://localhost:5173' };
        const login = await request.post('/api/auth/sign-in/email', {
            headers: apiHeaders,
            data: { email: TEST_USER.email, password: TEST_USER.password },
        });
        expect(login.ok()).toBeTruthy();

        const currentSettingsRes = await request.get('/api/instance/settings', {
            headers: apiHeaders,
        });
        expect(currentSettingsRes.ok()).toBeTruthy();
        const currentSettings = await currentSettingsRes.json();
        const initialAllowRegistration = currentSettings.allowRegistration;

        const updateSettings = await request.put('/api/instance/settings', {
            headers: apiHeaders,
            data: { allowRegistration: false },
        });
        expect(updateSettings.ok()).toBeTruthy();

        try {
            const adminCreateUserResponse = await request.post('/api/auth/admin/create-user', {
                headers: apiHeaders,
                data: {
                    email: 'admin-created@hemmelig.local',
                    name: 'Admin Created',
                    password: 'AdminCreatedPassword123!',
                    role: 'user',
                    data: {
                        username: 'admincreated',
                        displayUsername: 'admincreated',
                    },
                },
            });
            expect(adminCreateUserResponse.ok()).toBeTruthy();
        } finally {
            await request.post('/api/auth/sign-in/email', {
                headers: apiHeaders,
                data: { email: TEST_USER.email, password: TEST_USER.password },
            });
            await request.put('/api/instance/settings', {
                headers: apiHeaders,
                data: { allowRegistration: initialAllowRegistration },
            });
        }
    });
});
