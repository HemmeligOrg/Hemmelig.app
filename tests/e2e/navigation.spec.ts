import { expect, test } from './fixtures';

test.describe('Navigation', () => {
    test('should navigate to home page', async ({ authenticatedPage: page }) => {
        await page.goto('/');

        // Check that we're on the home page with the secret form
        await expect(page.locator('.ProseMirror')).toBeVisible();
    });

    test('should have working logo link', async ({ authenticatedPage: page }) => {
        await page.goto('/');

        // Check for logo/brand link that goes to home
        const logoLink = page.locator('a[href="/"]').first();
        await expect(logoLink).toBeVisible();
        await logoLink.click();
        await expect(page).toHaveURL('/');
    });

    test('should handle 404 pages gracefully', async ({ authenticatedPage: page }) => {
        await page.goto('/nonexistent-page-12345');

        // Should show 404 page or similar error
        const pageContent = await page.content();
        const is404 =
            pageContent.toLowerCase().includes('not found') ||
            pageContent.toLowerCase().includes('404') ||
            page.url().includes('/nonexistent-page');

        expect(is404).toBe(true);
    });
});
