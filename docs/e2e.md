# End-to-End Testing with Playwright

Hemmelig uses [Playwright](https://playwright.dev/) for end-to-end integration testing.

## Setup

Playwright and browsers are installed as dev dependencies. If you need to install browser dependencies on your system:

```bash
sudo npx playwright install-deps
```

### Test Database

The e2e tests automatically use a **separate test database** (`database/hemmelig-test.db`) that is:

1. Created fresh before each test run
2. Migrated with the latest schema
3. Seeded with a test user
4. Deleted after tests complete

This ensures tests don't affect your development database.

**Test User Credentials** (created automatically):

- Email: `e2e-test@hemmelig.local`
- Username: `e2etestuser`
- Password: `E2ETestPassword123!`

## Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run tests with interactive UI
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run a specific test file
npx playwright test tests/e2e/secret.spec.ts

# Run tests in headed mode (see the browser)
npx playwright test --headed
```

## Test Structure

Tests are located in `tests/e2e/`:

| File                 | Description                                       |
| -------------------- | ------------------------------------------------- |
| `auth.spec.ts`       | Authentication tests (setup, login, registration) |
| `home.spec.ts`       | Homepage and secret form tests                    |
| `secret.spec.ts`     | Secret creation, viewing, and deletion flows      |
| `navigation.spec.ts` | Navigation and routing tests                      |
| `fixtures.ts`        | Shared test fixtures (`authenticatedPage`)        |
| `global-setup.ts`    | Creates test database and user before tests       |
| `global-teardown.ts` | Cleans up test database after tests               |

## Configuration

The Playwright configuration is in `playwright.config.ts`:

- **Test directory**: `tests/e2e/`
- **Base URL**: `http://localhost:5173`
- **Browser**: Chromium (Desktop Chrome)
- **Web server**: Automatically starts Vite with test database
- **Global setup**: Creates fresh test database and test user
- **Global teardown**: Deletes test database

## Writing Tests

### Basic Test Structure

```typescript
import { expect, test } from '@playwright/test';

test.describe('Feature Name', () => {
    test('should do something', async ({ page }) => {
        await page.goto('/');

        // Interact with elements
        await page.locator('.ProseMirror').fill('My secret');
        await page.getByRole('button', { name: /create/i }).click();

        // Assert results
        await expect(page.getByText(/success/i)).toBeVisible();
    });
});
```

### Using Authenticated Page Fixture

For tests that require authentication:

```typescript
import { expect, test } from './fixtures';

test('should create a secret when logged in', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    // authenticatedPage is already logged in with test user
    await expect(authenticatedPage.locator('.ProseMirror')).toBeVisible();
});
```

### Common Patterns

**Interacting with the secret editor:**

```typescript
const editor = page.locator('.ProseMirror');
await editor.click();
await editor.fill('Secret content');
```

**Creating and viewing a secret:**

```typescript
// Create
await page.goto('/');
await page.locator('.ProseMirror').fill('My secret');
await page
    .getByRole('button', { name: /create/i })
    .first()
    .click();

// Get the URL
const urlInput = page.locator('input[readonly]').first();
const secretUrl = await urlInput.inputValue();

// View
await page.goto(secretUrl);
await page.getByRole('button', { name: /unlock/i }).click();
```

## CI Integration

Tests run in CI with these settings (from `playwright.config.ts`):

- `forbidOnly: true` - Fails if `.only` is left in tests
- `retries: 2` - Retries failed tests twice
- `workers: 1` - Single worker to prevent conflicts

### GitHub Actions Example

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps chromium

- name: Run E2E Tests
  run: npm run test:e2e
```

## Viewing Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Debugging Failed Tests

1. **Run in debug mode**: `npm run test:e2e:debug`
2. **Run with UI**: `npm run test:e2e:ui`
3. **View traces**: Failed tests generate traces in `test-results/`
4. **Screenshots**: Failed tests save screenshots automatically

## Best Practices

1. **Use data-testid for stable selectors** when possible
2. **Prefer user-facing selectors** like `getByRole`, `getByText`, `getByPlaceholder`
3. **Add appropriate timeouts** for async operations
4. **Keep tests independent** - each test should work in isolation
5. **Use `.first()` when multiple elements match** to avoid strict mode violations
