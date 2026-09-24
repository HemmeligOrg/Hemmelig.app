import { APIRequestContext, expect, test } from '@playwright/test';
import { TEST_USER } from './global-setup';

const SESSION_ONLY_ERROR = 'This action requires a signed-in session.';

/** A byte array in the JSON form that the API accepts for encrypted fields. */
const encryptedBytes = (length: number) =>
    Object.fromEntries(Array.from({ length }, (_, index) => [index, index % 256]));

const secretBody = () => ({
    secret: encryptedBytes(32),
    title: encryptedBytes(8),
    salt: 'c'.repeat(32),
    expiresAt: 3600,
    views: 1,
    isBurnable: false,
});

/** Signs in through Better Auth. The context keeps the session cookie. */
async function signIn(
    session: APIRequestContext,
    baseURL: string,
    username: string,
    password: string
) {
    const response = await session.post('/api/auth/sign-in/username', {
        data: { username, password },
        headers: { Origin: baseURL },
    });
    expect(response.ok()).toBeTruthy();
}

/** Creates an API key. Only a signed-in session can do this. */
async function createApiKey(session: APIRequestContext, baseURL: string, name: string) {
    const response = await session.post('/api/api-keys', {
        data: { name },
        headers: { Origin: baseURL },
    });
    expect(response.status()).toBe(201);
    const { key } = (await response.json()) as { key: string };
    return key;
}

test.describe('API key access', () => {
    // The tests share one user and its key, so they run in order in one worker.
    test.describe.configure({ mode: 'default' });

    const suffix = `${Date.now()}`;
    const user = {
        username: `apikey_user_${suffix}`,
        email: `apikey_user_${suffix}@hemmelig.local`,
        password: 'ApiKeyUser123!',
    };

    let baseURL: string;
    let adminApi: APIRequestContext;
    let session: APIRequestContext;
    let keyApi: APIRequestContext;
    let anonymousApi: APIRequestContext;
    let userId: string;

    test.beforeAll(async ({ playwright }, testInfo) => {
        baseURL = testInfo.project.use.baseURL ?? 'http://localhost:5173';

        // The admin creates a separate user, so a failed session-only check
        // cannot change the shared test user.
        const adminSession = await playwright.request.newContext({ baseURL });
        await signIn(adminSession, baseURL, TEST_USER.username, TEST_USER.password);
        const adminKey = await createApiKey(adminSession, baseURL, `admin-${suffix}`);
        await adminSession.dispose();

        adminApi = await playwright.request.newContext({
            baseURL,
            extraHTTPHeaders: { Authorization: `Bearer ${adminKey}` },
        });
        const created = await adminApi.post('/api/user', { data: user });
        expect(created.status()).toBe(201);
        userId = ((await created.json()) as { id: string }).id;

        session = await playwright.request.newContext({ baseURL });
        await signIn(session, baseURL, user.username, user.password);
        const key = await createApiKey(session, baseURL, `cli-${suffix}`);

        // A new context has no cookies, so every request authenticates with the key only.
        keyApi = await playwright.request.newContext({
            baseURL,
            extraHTTPHeaders: { Authorization: `Bearer ${key}` },
        });
        anonymousApi = await playwright.request.newContext({ baseURL });
    });

    test.afterAll(async () => {
        await adminApi?.delete(`/api/user/${userId}`);
        await Promise.all([adminApi, session, keyApi, anonymousApi].map((c) => c?.dispose()));
    });

    test('reads the account and lists API keys', async () => {
        const account = await keyApi.get('/api/account');
        expect(account.status()).toBe(200);
        expect(await account.json()).toMatchObject({ username: user.username, email: user.email });

        const keys = await keyApi.get('/api/api-keys');
        expect(keys.status()).toBe(200);
        expect(Array.isArray(await keys.json())).toBeTruthy();
    });

    test('rejects the key on the session-only routes', async () => {
        const createKey = await keyApi.post('/api/api-keys', { data: { name: 'from-a-key' } });
        expect(createKey.status()).toBe(403);
        expect(await createKey.json()).toEqual({ error: SESSION_ONLY_ERROR });

        const changePassword = await keyApi.put('/api/account/password', {
            data: { currentPassword: user.password, newPassword: 'ChangedPass123!' },
        });
        expect(changePassword.status()).toBe(403);
        expect(await changePassword.json()).toEqual({ error: SESSION_ONLY_ERROR });

        const deleteAccount = await keyApi.delete('/api/account');
        expect(deleteAccount.status()).toBe(403);
        expect(await deleteAccount.json()).toEqual({ error: SESSION_ONLY_ERROR });

        // The account still works with the original password.
        const account = await keyApi.get('/api/account');
        expect(account.status()).toBe(200);
    });

    test('creates, lists and deletes an owned secret', async () => {
        const created = await keyApi.post('/api/secrets', { data: secretBody() });
        expect(created.status()).toBe(201);
        const { id, deleteToken } = (await created.json()) as { id: string; deleteToken: string };
        expect(deleteToken).toBeTruthy();

        const list = await keyApi.get('/api/secrets');
        expect(list.status()).toBe(200);
        const { data } = (await list.json()) as { data: { id: string }[] };
        expect(data.some((secret) => secret.id === id)).toBeTruthy();

        // The owner deletes the secret without a delete token.
        const deleted = await keyApi.delete(`/api/secrets/${id}`);
        expect(deleted.status()).toBe(200);
    });

    test('deletes an anonymous secret with the creator token only', async () => {
        const created = await anonymousApi.post('/api/secrets', { data: secretBody() });
        expect(created.status()).toBe(201);
        const { id, deleteToken } = (await created.json()) as { id: string; deleteToken: string };

        const noToken = await anonymousApi.delete(`/api/secrets/${id}`);
        expect(noToken.status()).toBe(403);

        const notOwner = await keyApi.delete(`/api/secrets/${id}`);
        expect(notOwner.status()).toBe(403);

        const withToken = await anonymousApi.delete(`/api/secrets/${id}`, {
            headers: { 'x-hemmelig-delete-token': deleteToken },
        });
        expect(withToken.status()).toBe(200);
    });

    test('creates, lists and cancels a secret request', async () => {
        const created = await keyApi.post('/api/secret-requests', {
            data: { title: 'Database password', maxViews: 1, expiresIn: 3600, validFor: 86400 },
        });
        expect(created.status()).toBe(201);
        const { id } = (await created.json()) as { id: string };

        const list = await keyApi.get('/api/secret-requests');
        expect(list.status()).toBe(200);

        const single = await keyApi.get(`/api/secret-requests/${id}`);
        expect(single.status()).toBe(200);

        const cancelled = await keyApi.delete(`/api/secret-requests/${id}`);
        expect(cancelled.status()).toBe(200);
    });

    test('uploads a file and attaches it to a secret', async () => {
        const upload = await keyApi.post('/api/files', {
            headers: {
                'Content-Type': 'application/octet-stream',
                'X-Hemmelig-File-Name': 'abcd1234',
            },
            data: Buffer.alloc(1024, 7),
        });
        expect(upload.status()).toBe(201);
        const file = (await upload.json()) as { id: string; token: string };
        expect(file.token).toBeTruthy();

        const secret = await keyApi.post('/api/secrets', {
            data: { ...secretBody(), files: [{ id: file.id, token: file.token }] },
        });
        expect(secret.status()).toBe(201);
    });
});
