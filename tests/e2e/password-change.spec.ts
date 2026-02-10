import { expect, test } from '@playwright/test';
import { TEST_USER } from './global-setup';

const WEAK_PASSWORD_USER = {
    email: 'weakpass@hemmelig.local',
    username: 'weakpassuser',
    password: 'pass',
    name: 'Weak Password User',
};

const NEW_STRONG_PASSWORD = 'NewStrongPass123!';

/**
 * Helper: sign in via the better-auth API and return session cookies.
 */
async function signInViaAPI(
    baseURL: string,
    email: string,
    password: string
): Promise<{ cookie: string }> {
    const res = await fetch(`${baseURL}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Origin: baseURL,
        },
        body: JSON.stringify({ email, password }),
        redirect: 'manual',
    });

    const setCookieHeaders = res.headers.getSetCookie();
    const cookie = setCookieHeaders
        .map((c) => c.split(';')[0])
        .filter(Boolean)
        .join('; ');

    return { cookie };
}

test.describe('Password Change', () => {
    test.beforeAll(async ({}, testInfo) => {
        const baseURL = testInfo.project.use.baseURL || 'http://localhost:5173';

        // Sign in as admin to get session cookies
        const { cookie: adminCookie } = await signInViaAPI(
            baseURL,
            TEST_USER.email,
            TEST_USER.password
        );

        // Use better-auth admin endpoint to create a user with a weak password.
        // This bypasses the sign-up hook (which only runs on /sign-up/email),
        // and since minPasswordLength is 1, better-auth accepts it.
        const createRes = await fetch(`${baseURL}/api/auth/admin/create-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Origin: baseURL,
                Cookie: adminCookie,
            },
            body: JSON.stringify({
                email: WEAK_PASSWORD_USER.email,
                password: WEAK_PASSWORD_USER.password,
                name: WEAK_PASSWORD_USER.name,
                role: 'user',
                data: {
                    username: WEAK_PASSWORD_USER.username,
                },
            }),
        });

        if (!createRes.ok) {
            const body = await createRes.text();
            // Ignore if user already exists (e.g. from a previous test run)
            if (!body.includes('already') && !body.includes('exists')) {
                throw new Error(`Failed to create weak-password user: ${createRes.status} ${body}`);
            }
        }
    });

    test('should allow a user with a weak password to change their password and log in with the new one', async ({
        page,
    }) => {
        // Log in as the weak-password user
        await page.goto('/login');
        await page.getByPlaceholder(/username/i).fill(WEAK_PASSWORD_USER.username);
        await page.getByPlaceholder(/password/i).fill(WEAK_PASSWORD_USER.password);
        await page.getByRole('button', { name: /sign in/i }).click();

        // Wait for login to complete
        await page.waitForURL(/^\/$|\/dashboard/, { timeout: 10000 });

        // Navigate to account settings
        await page.goto('/dashboard/account');

        // Click on the Security tab
        await page.getByRole('button', { name: /security/i }).click();

        // Fill in the password change form
        await page.getByPlaceholder(/enter current password/i).fill(WEAK_PASSWORD_USER.password);
        await page.getByPlaceholder(/enter new password/i).fill(NEW_STRONG_PASSWORD);
        await page.getByPlaceholder(/confirm new password/i).fill(NEW_STRONG_PASSWORD);

        // Submit the password change
        await page.getByRole('button', { name: /change password/i }).click();

        // Verify success message appears
        await expect(page.getByText(/password changed successfully/i)).toBeVisible({
            timeout: 10000,
        });

        // Sign out by clearing cookies and navigating to login
        await page.context().clearCookies();
        await page.goto('/login');

        // Log in with the new password
        await page.getByPlaceholder(/username/i).fill(WEAK_PASSWORD_USER.username);
        await page.getByPlaceholder(/password/i).fill(NEW_STRONG_PASSWORD);
        await page.getByRole('button', { name: /sign in/i }).click();

        // Verify login succeeds
        await page.waitForURL(/^\/$|\/dashboard/, { timeout: 10000 });
    });
});
