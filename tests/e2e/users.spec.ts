import { expect, test } from './fixtures';

test.describe('User management', () => {
    test('clears the add user form after creating a user', async ({ authenticatedPage: page }) => {
        await page.goto('/dashboard/users');
        await page.getByRole('button', { name: 'Add User' }).click();

        const modal = page.getByRole('heading', { name: 'Add User' }).locator('../..');
        const inputs = modal.locator('input');
        await inputs.nth(0).fill('Second User');
        await inputs.nth(1).fill('seconduser');
        await inputs.nth(2).fill('second@example.com');
        await inputs.nth(3).fill('SecondPassword123!');
        await modal.locator('select').selectOption('admin');
        await modal.getByRole('button', { name: 'Add User' }).click();

        await expect(modal).toBeHidden();
        await page.getByRole('button', { name: 'Add User' }).click();

        await expect(inputs.nth(0)).toHaveValue('');
        await expect(inputs.nth(1)).toHaveValue('');
        await expect(inputs.nth(2)).toHaveValue('');
        await expect(inputs.nth(3)).toHaveValue('');
        await expect(modal.locator('select')).toHaveValue('user');
    });
});
