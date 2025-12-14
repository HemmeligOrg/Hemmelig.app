import { test as base, expect, Page } from '@playwright/test';
import { TEST_USER } from './global-setup';

async function loginUser(page: Page, email: string, password: string): Promise<boolean> {
    await page.goto('/login');

    // Fill login form
    await page.getByPlaceholder(/username/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation - could be home, dashboard, or 2FA
    try {
        await page.waitForURL(/^\/$|\/dashboard|\/verify-2fa/, { timeout: 10000 });
        return true;
    } catch {
        return false;
    }
}

// Extend the base test with auth fixture
export const test = base.extend<{ authenticatedPage: Page }>({
    authenticatedPage: async ({ page }, use) => {
        // Check if authentication is required
        await page.goto('/');

        if (page.url().includes('/login')) {
            // Login with test user (created in global setup)
            await loginUser(page, TEST_USER.email, TEST_USER.password);
        }

        await use(page);
    },
});

export { expect, TEST_USER };
