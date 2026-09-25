import { expect, test, type Page } from '@playwright/test';

// A 1x1 transparent PNG as a data URI, like an admin sets in HEMMELIG_AUTH_GENERIC_OAUTH.
const ICON =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/**
 * Replaces the social provider config with a generic OIDC provider.
 * The test server has no social provider, so the test stubs the response.
 */
async function stubSocialProviders(page: Page, hidePasswordLogin: boolean) {
    await page.route('**/api/config/social-providers', (route) =>
        route.fulfill({
            json: {
                providers: ['keycloak'],
                providerDetails: [
                    {
                        id: 'keycloak',
                        generic: true,
                        label: 'Log in with Company ID',
                        icon: ICON,
                    },
                ],
                hidePasswordLogin,
                callbackBaseUrl: '',
            },
        })
    );
}

test.describe('Login page options', () => {
    test('shows the password form and no social buttons by default', async ({ page }) => {
        await page.goto('/login');

        await expect(page.getByLabel('Username', { exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: /continue with/i })).toHaveCount(0);
    });

    test('shows the custom label and icon of a generic provider', async ({ page }) => {
        await stubSocialProviders(page, false);
        await page.goto('/login');

        const button = page.getByRole('button', { name: 'Log in with Company ID' });
        await expect(button).toBeVisible();
        await expect(button.locator('img')).toHaveAttribute('src', ICON);
        await expect(page.getByLabel('Username', { exact: true })).toBeVisible();
    });

    test('hides the password form when the option is on', async ({ page }) => {
        await stubSocialProviders(page, true);
        await page.goto('/login');

        await expect(page.getByRole('button', { name: 'Log in with Company ID' })).toBeVisible();
        await expect(page.getByLabel('Username', { exact: true })).toHaveCount(0);
        await expect(page.getByLabel('Password', { exact: true })).toHaveCount(0);
    });

    test('shows the password form again with showLogin=true', async ({ page }) => {
        await stubSocialProviders(page, true);
        await page.goto('/login?showLogin=true');

        await expect(page.getByLabel('Username', { exact: true })).toBeVisible();
        await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Log in with Company ID' })).toBeVisible();
    });
});
