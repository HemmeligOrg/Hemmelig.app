import { expect, test } from './fixtures';

test.describe('Secret Creation and Viewing', () => {
    test('should create a secret and display the secret URL', async ({
        authenticatedPage: page,
    }) => {
        await page.goto('/');

        // Type secret content in the editor
        const editor = page.locator('.ProseMirror');
        await editor.click();
        await editor.fill('This is my test secret message');

        // Click create button
        await page
            .getByRole('button', { name: /create/i })
            .first()
            .click();

        // Wait for success state - check for the success icon or URL field
        await expect(page.getByText(/secret.*created/i)).toBeVisible({ timeout: 10000 });

        // Verify the secret URL is displayed
        const urlInput = page.locator('input[readonly]').first();
        await expect(urlInput).toBeVisible();

        const secretUrl = await urlInput.inputValue();
        expect(secretUrl).toContain('/secret/');
        expect(secretUrl).toContain('#decryptionKey=');
    });

    test('should create a secret with a title', async ({ authenticatedPage: page }) => {
        await page.goto('/');

        // Type secret content
        const editor = page.locator('.ProseMirror');
        await editor.click();
        await editor.fill('Secret with a title');

        // Add a title
        const titleInput = page.getByPlaceholder(/title/i);
        if (await titleInput.isVisible()) {
            await titleInput.fill('My Secret Title');
        }

        // Create the secret
        await page
            .getByRole('button', { name: /create/i })
            .first()
            .click();

        // Verify success
        await expect(page.getByText(/secret.*created/i)).toBeVisible({ timeout: 10000 });
    });

    test('should create and view a secret end-to-end', async ({ authenticatedPage: page }) => {
        await page.goto('/');

        const secretText = `Test secret created at ${Date.now()}`;

        // Create a secret
        const editor = page.locator('.ProseMirror');
        await editor.click();
        await editor.fill(secretText);

        await page
            .getByRole('button', { name: /create/i })
            .first()
            .click();

        // Wait for the URL to appear
        await expect(page.getByText(/secret.*created/i)).toBeVisible({ timeout: 10000 });

        // Get the secret URL
        const urlInput = page.locator('input[readonly]').first();
        const secretUrl = await urlInput.inputValue();

        // Navigate to the secret URL
        await page.goto(secretUrl);

        // Click the unlock/view button
        const unlockButton = page.getByRole('button', { name: /unlock|view/i });
        await expect(unlockButton).toBeVisible({ timeout: 5000 });
        await unlockButton.click();

        // Verify the secret content is displayed
        await expect(page.locator('.ProseMirror')).toContainText(secretText, { timeout: 10000 });
    });

    test('should create a password-protected secret', async ({ authenticatedPage: page }) => {
        await page.goto('/');

        const secretText = 'This is a password protected secret';
        const password = 'mysecretpassword123';

        // Type secret content
        const editor = page.locator('.ProseMirror');
        await editor.click();
        await editor.fill(secretText);

        // Enable password protection
        const passwordRow = page
            .locator('div.flex.items-center.justify-between')
            .filter({ hasText: 'Password Protection' });
        await passwordRow.locator('button').click();

        // Fill the password input that appears
        const passwordInput = page
            .locator('input[placeholder*="password" i], input[type="password"]')
            .first();
        await expect(passwordInput).toBeVisible({ timeout: 5000 });
        await passwordInput.fill(password);

        // Create the secret
        await page
            .getByRole('button', { name: /create/i })
            .first()
            .click();

        // Wait for success
        await expect(page.getByText(/secret.*created/i)).toBeVisible({ timeout: 10000 });

        // Get the secret URL
        const urlInput = page.locator('input[readonly]').first();
        const secretUrl = await urlInput.inputValue();

        // Password-protected links must not carry the decryption key.
        expect(secretUrl).not.toContain('#decryptionKey=');

        // Navigate to the secret
        await page.goto(secretUrl);

        // The secret page must prompt for the password
        const passwordPrompt = page.locator('input[type="password"]').first();
        await expect(passwordPrompt).toBeVisible({ timeout: 5000 });
        await passwordPrompt.fill(password);

        const unlockButton = page.getByRole('button', { name: /unlock|view/i });
        await expect(unlockButton).toBeVisible({ timeout: 5000 });
        await unlockButton.click();

        // Verify content is visible after the password is verified
        await expect(page.locator('.ProseMirror')).toContainText(secretText, { timeout: 10000 });
    });

    test('should burn a secret after viewing', async ({ authenticatedPage: page }) => {
        await page.goto('/');

        // Create a secret
        const editor = page.locator('.ProseMirror');
        await editor.click();
        await editor.fill('Secret to be burned');

        await page
            .getByRole('button', { name: /create/i })
            .first()
            .click();

        // Wait for success and get URL
        await expect(page.getByText(/secret.*created/i)).toBeVisible({ timeout: 10000 });
        const urlInput = page.locator('input[readonly]').first();
        const secretUrl = await urlInput.inputValue();

        // View the secret
        await page.goto(secretUrl);
        await page.getByRole('button', { name: /unlock|view/i }).click();
        await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 10000 });

        // Delete the secret
        await page.getByRole('button', { name: /delete/i }).click();

        // Confirm deletion in modal
        const confirmButton = page.getByRole('button', { name: /delete|confirm/i }).last();
        await confirmButton.click();

        // Should redirect to home
        await expect(page).toHaveURL('/');
    });
});
