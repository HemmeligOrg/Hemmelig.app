import { APIRequestContext, expect, PlaywrightWorkerArgs, test } from '@playwright/test';
import { TEST_USER } from './global-setup';

type AdminUser = { id: string; username: string; role: string; banned: boolean };

/** Signs in through Better Auth and returns the response status. */
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
    return response.status();
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

test.describe('Admin API with an API key', () => {
    // The tests share one admin key, so they run in order in one worker.
    test.describe.configure({ mode: 'default' });

    const suffix = `${Date.now()}`;
    let baseURL: string;
    let adminApi: APIRequestContext;
    let adminId: string;

    /** Signs in as the user in a new context. Returns the status. */
    const signInAs = async (
        playwright: PlaywrightWorkerArgs['playwright'],
        username: string,
        password: string
    ) => {
        const session = await playwright.request.newContext({ baseURL });
        const status = await signIn(session, baseURL, username, password);
        await session.dispose();
        return status;
    };

    test.beforeAll(async ({ playwright }, testInfo) => {
        baseURL = testInfo.project.use.baseURL ?? 'http://localhost:5173';

        const session = await playwright.request.newContext({ baseURL });
        expect(await signIn(session, baseURL, TEST_USER.username, TEST_USER.password)).toBe(200);
        const key = await createApiKey(session, baseURL, `admin-api-${suffix}`);
        await session.dispose();

        adminApi = await playwright.request.newContext({
            baseURL,
            extraHTTPHeaders: { Authorization: `Bearer ${key}` },
        });

        const search = await adminApi.get(`/api/user?search=${TEST_USER.username}`);
        const { users } = (await search.json()) as { users: AdminUser[] };
        const admin = users.find((user) => user.username === TEST_USER.username);
        expect(admin).toBeTruthy();
        adminId = admin?.id ?? '';
    });

    test.afterAll(async () => {
        await adminApi?.dispose();
    });

    test('creates, bans, unbans, sets the password of and deletes a user', async ({
        playwright,
    }) => {
        const username = `managed_${suffix}`;
        const created = await adminApi.post('/api/user', {
            data: {
                username,
                email: `${username}@hemmelig.local`,
                password: 'ManagedUser123!',
                name: 'Managed User',
            },
        });
        expect(created.status()).toBe(201);
        const user = (await created.json()) as AdminUser;
        expect(user).toMatchObject({ username, role: 'user', banned: false });
        expect(await signInAs(playwright, username, 'ManagedUser123!')).toBe(200);

        const banned = await adminApi.post(`/api/user/${user.id}/ban`, {
            data: { reason: 'E2E test' },
        });
        expect(banned.status()).toBe(200);
        expect(((await banned.json()) as AdminUser).banned).toBe(true);
        expect(await signInAs(playwright, username, 'ManagedUser123!')).not.toBe(200);

        const unbanned = await adminApi.post(`/api/user/${user.id}/unban`);
        expect(unbanned.status()).toBe(200);
        expect(((await unbanned.json()) as AdminUser).banned).toBe(false);

        const password = await adminApi.put(`/api/user/${user.id}/password`, {
            data: { password: 'ChangedUser123!' },
        });
        expect(password.status()).toBe(200);
        expect(await signInAs(playwright, username, 'ChangedUser123!')).toBe(200);

        const promoted = await adminApi.put(`/api/user/${user.id}`, { data: { role: 'admin' } });
        expect(promoted.status()).toBe(200);
        expect(((await promoted.json()) as AdminUser).role).toBe('admin');

        const deleted = await adminApi.delete(`/api/user/${user.id}`);
        expect(deleted.status()).toBe(200);

        const missing = await adminApi.delete(`/api/user/${user.id}`);
        expect(missing.status()).toBe(404);
    });

    test('rejects a weak password and a duplicate user', async () => {
        const weak = await adminApi.post('/api/user', {
            data: {
                username: `weak_${suffix}`,
                email: `weak-${suffix}@hemmelig.local`,
                password: 'weak',
            },
        });
        expect(weak.status()).toBe(400);

        const duplicate = await adminApi.post('/api/user', {
            data: {
                username: TEST_USER.username,
                email: `other-${suffix}@hemmelig.local`,
                password: 'Duplicate123!',
            },
        });
        expect(duplicate.status()).toBe(409);
    });

    test('does not let the admin ban, demote or delete themselves', async () => {
        const ban = await adminApi.post(`/api/user/${adminId}/ban`, { data: {} });
        expect(ban.status()).toBe(400);

        const demote = await adminApi.put(`/api/user/${adminId}`, { data: { role: 'user' } });
        expect(demote.status()).toBe(400);

        const remove = await adminApi.delete(`/api/user/${adminId}`);
        expect(remove.status()).toBe(400);
    });

    test('manages invites', async () => {
        const created = await adminApi.post('/api/invites', {
            data: { maxUses: 1, expiresInDays: 7 },
        });
        expect(created.status()).toBe(201);
        const { id } = (await created.json()) as { id: string };

        const list = await adminApi.get('/api/invites');
        expect(list.status()).toBe(200);

        const deactivated = await adminApi.delete(`/api/invites/${id}`);
        expect(deactivated.status()).toBe(200);
    });

    test('reads and updates instance settings and reads analytics', async () => {
        const settings = await adminApi.get('/api/instance/settings');
        expect(settings.status()).toBe(200);
        const { importantMessage } = (await settings.json()) as { importantMessage: string };

        // Write the current value back, so parallel tests see no change.
        const updated = await adminApi.put('/api/instance/settings', {
            data: { importantMessage },
        });
        expect(updated.status()).toBe(200);

        const analytics = await adminApi.get('/api/analytics?timeRange=7d');
        expect(analytics.status()).toBe(200);
    });

    test('rejects a non-admin key on admin routes', async ({ playwright }) => {
        const username = `plain_${suffix}`;
        const created = await adminApi.post('/api/user', {
            data: { username, email: `${username}@hemmelig.local`, password: 'PlainUser123!' },
        });
        expect(created.status()).toBe(201);
        const { id } = (await created.json()) as AdminUser;

        const session = await playwright.request.newContext({ baseURL });
        expect(await signIn(session, baseURL, username, 'PlainUser123!')).toBe(200);
        const key = await createApiKey(session, baseURL, `plain_${suffix}`);
        await session.dispose();

        const userApi = await playwright.request.newContext({
            baseURL,
            extraHTTPHeaders: { Authorization: `Bearer ${key}` },
        });

        const requests = [
            userApi.get('/api/user'),
            userApi.post('/api/user', {
                data: {
                    username: `blocked_${suffix}`,
                    email: `blocked-${suffix}@hemmelig.local`,
                    password: 'Blocked123!',
                },
            }),
            userApi.post(`/api/user/${adminId}/ban`, { data: {} }),
            userApi.get('/api/invites'),
            userApi.get('/api/instance/settings'),
            userApi.put('/api/instance/settings', { data: { importantMessage: 'blocked' } }),
            userApi.get('/api/analytics'),
        ];
        for (const response of await Promise.all(requests)) {
            expect(response.status()).toBe(403);
        }

        await userApi.dispose();
        await adminApi.delete(`/api/user/${id}`);
    });
});
