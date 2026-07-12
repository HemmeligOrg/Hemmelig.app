import { expect, test } from './fixtures';

test.describe('User management', () => {
    test('clears the add user form after creating a user', async ({ authenticatedPage: page }) => {
        await page.goto('/dashboard/users');
        await page.getByRole('button', { name: 'Add User' }).click();

        const nameInput = page.getByLabel('Name', { exact: true });
        const usernameInput = page.getByLabel('Username', { exact: true });
        const emailInput = page.getByLabel('Email', { exact: true });
        const passwordInput = page.getByLabel('Password', { exact: true });
        const roleSelect = page.getByLabel('Role', { exact: true });

        await nameInput.fill('Second User');
        await usernameInput.fill('seconduser');
        await emailInput.fill('second@example.com');
        await passwordInput.fill('SecondPassword123!');
        await roleSelect.selectOption('admin');
        await page.getByRole('button', { name: 'Add User' }).last().click();

        await expect(page.getByRole('heading', { name: 'Add User' })).toBeHidden();
        await page.getByRole('button', { name: 'Add User' }).click();

        await expect(nameInput).toHaveValue('');
        await expect(usernameInput).toHaveValue('');
        await expect(emailInput).toHaveValue('');
        await expect(passwordInput).toHaveValue('');
        await expect(roleSelect).toHaveValue('user');
    });
});
