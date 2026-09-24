import { expect, test } from './fixtures';

test.describe('Instance settings', () => {
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
});
