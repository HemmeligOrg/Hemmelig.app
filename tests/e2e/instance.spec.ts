import { expect, test } from './fixtures';

// A 1x1 PNG, small enough for the logo upload limit.
const PNG_PIXEL = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
);

test.describe('Instance settings', () => {
    // These tests save the shared General settings, so they must not overlap.
    test.describe.configure({ mode: 'serial' });

    test('shows the save result and hides it after an edit', async ({
        authenticatedPage: page,
    }) => {
        await page.goto('/dashboard/instance');

        const note = page.getByRole('status');
        await expect(note).toHaveText('Changes apply to new secrets.');

        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(note).toHaveText('Saved. Changes apply to new secrets.');

        // An edit makes the saved result stale, so the default note comes back.
        await page.getByRole('textbox').first().fill('e2e instance');
        await expect(note).toHaveText('Changes apply to new secrets.');
    });

    test('uses the default max views in the composer', async ({ authenticatedPage: page }) => {
        // Serve the setting through the public settings response. A saved
        // setting would change the default for tests that run in parallel.
        await page.route('**/api/instance/settings/public', async (route) => {
            const response = await route.fetch();
            const settings = await response.json();
            await route.fulfill({ response, json: { ...settings, defaultMaxViews: 3 } });
        });

        await page.goto('/');
        await page.getByRole('button', { name: /options/i }).click();
        await expect(page.getByRole('textbox', { name: 'Max views', exact: true })).toHaveValue(
            '3'
        );
    });

    test('shows the dark-mode logo in the dark theme only', async ({ authenticatedPage: page }) => {
        const note = page.getByRole('status');
        const headerLogo = page.getByRole('banner').locator('img');

        await page.goto('/dashboard/instance');
        await page.getByTestId('instanceLogoDark-input').setInputFiles({
            name: 'dark.png',
            mimeType: 'image/png',
            buffer: PNG_PIXEL,
        });
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(note).toHaveText('Saved. Changes apply to new secrets.');

        try {
            // The default theme is dark, so the header shows the dark logo.
            await page.goto('/');
            await expect(headerLogo).toHaveAttribute('src', /^data:image\/png;base64,/);

            // In the light theme, the header falls back to the built-in logo.
            await page.getByRole('button', { name: /switch to light mode/i }).click();
            await expect(headerLogo).toHaveCount(0);
        } finally {
            await page.goto('/dashboard/instance');
            await page.getByRole('button', { name: 'Remove' }).click();
            await page.getByRole('button', { name: 'Save', exact: true }).click();
            await expect(note).toHaveText('Saved. Changes apply to new secrets.');
        }
    });
});
