import { expect, test } from './fixtures';

test.describe('Home Page', () => {
    test('should display the secret creation form', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Check that the editor is present
        await expect(authenticatedPage.locator('.ProseMirror')).toBeVisible();

        // Check that the create button exists (there are two, use first())
        await expect(
            authenticatedPage.getByRole('button', { name: /create/i }).first()
        ).toBeVisible();
    });

    test('should have working dark/light mode toggle', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Check initial theme (could be light or dark based on system preference)
        const html = authenticatedPage.locator('html');

        // Find and click theme toggle button
        const themeToggle = authenticatedPage
            .locator(
                'button[aria-label*="theme"], button:has([class*="Moon"]), button:has([class*="Sun"])'
            )
            .first();

        if (await themeToggle.isVisible()) {
            const initialClass = await html.getAttribute('class');
            await themeToggle.click();

            // Theme should have changed
            await expect(html).not.toHaveClass(initialClass || '');
        }
    });
});
