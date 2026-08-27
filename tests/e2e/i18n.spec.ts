import { expect, test } from '@playwright/test';

test('should resolve regional Portuguese and render translated labels', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('hemmelig-language', 'pt-BR');
    });
    await page.goto('/');

    await expect(page.getByLabel('Select language')).toHaveValue('pt');

    await page.goto('/register');
    const passwordInput = page.getByPlaceholder('Crie uma senha');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('a');

    await expect(page.getByText(/Força da senha:\s+Muito Fraca/)).toBeVisible();
});
