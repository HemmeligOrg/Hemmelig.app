import { test as base, expect, Page } from '@playwright/test';
import { TEST_USER } from './global-setup';

async function loginUser(page: Page, username: string, password: string): Promise<void> {
    await page.goto('/login');

    // Fill login form
    await page.getByLabel('Username', { exact: true }).fill(username);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL((url) => url.pathname.startsWith('/dashboard'), { timeout: 10000 });
}

// Extend the base test with auth fixture
export const test = base.extend<{ authenticatedPage: Page }>({
    authenticatedPage: async ({ page }, provideAuthenticatedPage) => {
        await loginUser(page, TEST_USER.username, TEST_USER.password);

        await provideAuthenticatedPage(page);
    },
});

export { expect, TEST_USER };
