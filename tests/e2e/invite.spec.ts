import type { APIResponse } from '@playwright/test';
import Database from 'better-sqlite3';
import { expect, test, TEST_USER } from './fixtures';

const apiHeaders: Record<string, string> = { Origin: 'http://localhost:5173' };

test.describe('Invite-only registration', () => {
    test('blocks sign-up without a valid invite code when required', async ({ page, request }) => {
        // Sign in as the admin test user
        const login: APIResponse = await request.post('/api/auth/sign-in/email', {
            headers: apiHeaders,
            data: { email: TEST_USER.email, password: TEST_USER.password },
        });
        if (!login.ok()) {
            console.error('sign-in response:', login.status(), await login.text());
        }
        expect(login.ok()).toBeTruthy();

        // Enable invite-only registration
        const enable: APIResponse = await request.put('/api/instance/settings', {
            headers: apiHeaders,
            data: { requireInviteCode: true },
        });
        expect(enable.ok()).toBeTruthy();

        try {
            const signupUrl: string = '/api/auth/sign-up/email';
            const baseUser: { name: string; username: string; password: string } = {
                name: 'invitee',
                username: 'inviteetest',
                password: 'InviteTestPassword123!',
            };

            // No invite code -> forbidden
            const noCode: APIResponse = await request.post(signupUrl, {
                headers: apiHeaders,
                data: { email: 'no-invite@hemmelig.local', ...baseUser },
            });
            expect(noCode.status()).toBe(403);

            // Invalid invite code -> forbidden
            const badCode: APIResponse = await request.post(signupUrl, {
                headers: apiHeaders,
                data: {
                    email: 'bad-invite@hemmelig.local',
                    ...baseUser,
                    inviteCode: 'NOTAREALCODE',
                },
            });
            expect(badCode.status()).toBe(403);

            // Deactivated invite code -> forbidden
            const deactivatedInvite: APIResponse = await request.post('/api/invites', {
                headers: apiHeaders,
                data: { maxUses: 1 },
            });
            expect(deactivatedInvite.ok()).toBeTruthy();
            const { id: deactId, code: deactCode }: { id: string; code: string } =
                await deactivatedInvite.json();
            const deleteInvite: APIResponse = await request.delete(`/api/invites/${deactId}`, {
                headers: apiHeaders,
            });
            expect(deleteInvite.ok()).toBeTruthy();

            const deactSignup: APIResponse = await request.post(signupUrl, {
                headers: apiHeaders,
                data: {
                    email: 'deact-invite@hemmelig.local',
                    ...baseUser,
                    inviteCode: deactCode,
                },
            });
            expect(deactSignup.status()).toBe(403);

            // Valid single-use invite code -> sign-up succeeds
            const invite: APIResponse = await request.post('/api/invites', {
                headers: apiHeaders,
                data: { maxUses: 1 },
            });
            expect(invite.ok()).toBeTruthy();
            const { code }: { code: string } = await invite.json();

            // A failed registration attempt (e.g. duplicate email) does NOT burn the invite code
            const failedAttempt: APIResponse = await request.post(signupUrl, {
                headers: apiHeaders,
                data: {
                    email: TEST_USER.email,
                    username: 'unique_candidate',
                    password: 'CandidatePassword123!',
                    inviteCode: code,
                },
            });
            expect(failedAttempt.status()).not.toBe(200);

            // Valid registration using the same code still succeeds because it wasn't burned
            const withCode: APIResponse = await request.post(signupUrl, {
                headers: apiHeaders,
                data: {
                    email: 'with-invite@hemmelig.local',
                    ...baseUser,
                    inviteCode: code,
                },
            });
            if (withCode.status() !== 200) {
                console.error('valid-code signup:', withCode.status(), await withCode.text());
            }
            expect(withCode.status()).toBe(200);

            // The code is consumed server-side -> reuse is rejected
            const reused: APIResponse = await request.post(signupUrl, {
                headers: apiHeaders,
                data: {
                    email: 'reused-invite@hemmelig.local',
                    ...baseUser,
                    inviteCode: code,
                },
            });
            expect(reused.status()).toBe(403);

            // The register form asks for an invite code
            await page.goto('/register');
            await expect(page.getByPlaceholder(/invite code/i)).toBeVisible();
        } finally {
            // Restore the setting as admin
            await request.post('/api/auth/sign-in/email', {
                headers: apiHeaders,
                data: { email: TEST_USER.email, password: TEST_USER.password },
            });
            await request.put('/api/instance/settings', {
                headers: apiHeaders,
                data: { requireInviteCode: false },
            });
        }
    });

    test('rejects sign-up with an expired invite code', async ({ request }) => {
        const login: APIResponse = await request.post('/api/auth/sign-in/email', {
            headers: apiHeaders,
            data: { email: TEST_USER.email, password: TEST_USER.password },
        });
        expect(login.ok()).toBeTruthy();

        const enable: APIResponse = await request.put('/api/instance/settings', {
            headers: apiHeaders,
            data: { requireInviteCode: true },
        });
        expect(enable.ok()).toBeTruthy();

        try {
            const invite: APIResponse = await request.post('/api/invites', {
                headers: apiHeaders,
                data: { maxUses: 1 },
            });
            expect(invite.ok()).toBeTruthy();
            const { id, code }: { id: string; code: string } = await invite.json();

            // Set the invite expiration to the past in the SQLite database
            const db: InstanceType<typeof Database> = new Database('./database/hemmelig-test.db');
            const pastDate: string = new Date(Date.now() - 60000).toISOString();
            db.prepare('UPDATE invite_codes SET expiresAt = ? WHERE id = ?').run(pastDate, id);
            db.close();

            const expiredSignup: APIResponse = await request.post('/api/auth/sign-up/email', {
                headers: apiHeaders,
                data: {
                    email: 'expired-test@hemmelig.local',
                    name: 'Expired Test',
                    username: 'expiredtestuser',
                    password: 'ExpiredPassword123!',
                    inviteCode: code,
                },
            });
            expect(expiredSignup.status()).toBe(403);
            const body: { message?: string } = await expiredSignup.json();
            expect(body.message).toBe('Invite code has expired.');
        } finally {
            await request.post('/api/auth/sign-in/email', {
                headers: apiHeaders,
                data: { email: TEST_USER.email, password: TEST_USER.password },
            });
            await request.put('/api/instance/settings', {
                headers: apiHeaders,
                data: { requireInviteCode: false },
            });
        }
    });

    test('preserves invite code when registration fails email domain validation', async ({
        request,
    }) => {
        const login: APIResponse = await request.post('/api/auth/sign-in/email', {
            headers: apiHeaders,
            data: { email: TEST_USER.email, password: TEST_USER.password },
        });
        expect(login.ok()).toBeTruthy();

        // Enable invite code and restrict email domain to allowed.local
        const enable: APIResponse = await request.put('/api/instance/settings', {
            headers: apiHeaders,
            data: { requireInviteCode: true, allowedEmailDomains: 'allowed.local' },
        });
        expect(enable.ok()).toBeTruthy();

        try {
            const invite: APIResponse = await request.post('/api/invites', {
                headers: apiHeaders,
                data: { maxUses: 1 },
            });
            expect(invite.ok()).toBeTruthy();
            const { code }: { code: string } = await invite.json();

            const signupUrl: string = '/api/auth/sign-up/email';

            // 1. Attempt sign-up with disallowed email domain
            const disallowedAttempt: APIResponse = await request.post(signupUrl, {
                headers: apiHeaders,
                data: {
                    email: 'user@forbidden.local',
                    name: 'Disallowed User',
                    username: 'disalloweduser',
                    password: 'ValidPassword123!',
                    inviteCode: code,
                },
            });
            expect(disallowedAttempt.status()).toBe(403);

            // 2. The invite code was NOT burned; registration with allowed domain succeeds
            const allowedAttempt: APIResponse = await request.post(signupUrl, {
                headers: apiHeaders,
                data: {
                    email: 'user@allowed.local',
                    name: 'Allowed User',
                    username: 'alloweduser',
                    password: 'ValidPassword123!',
                    inviteCode: code,
                },
            });
            expect(allowedAttempt.status()).toBe(200);

            // 3. Now the single-use invite code is burned and cannot be used again
            const reuseAttempt: APIResponse = await request.post(signupUrl, {
                headers: apiHeaders,
                data: {
                    email: 'second@allowed.local',
                    name: 'Second Allowed',
                    username: 'secondallowed',
                    password: 'ValidPassword123!',
                    inviteCode: code,
                },
            });
            expect(reuseAttempt.status()).toBe(403);
        } finally {
            await request.post('/api/auth/sign-in/email', {
                headers: apiHeaders,
                data: { email: TEST_USER.email, password: TEST_USER.password },
            });
            await request.put('/api/instance/settings', {
                headers: apiHeaders,
                data: { requireInviteCode: false, allowedEmailDomains: '' },
            });
        }
    });

    test('handles concurrent registration attempts with a single-use invite code', async ({
        request,
    }) => {
        const login: APIResponse = await request.post('/api/auth/sign-in/email', {
            headers: apiHeaders,
            data: { email: TEST_USER.email, password: TEST_USER.password },
        });
        expect(login.ok()).toBeTruthy();

        const enable: APIResponse = await request.put('/api/instance/settings', {
            headers: apiHeaders,
            data: { requireInviteCode: true, allowedEmailDomains: '' },
        });
        expect(enable.ok()).toBeTruthy();

        try {
            const invite: APIResponse = await request.post('/api/invites', {
                headers: apiHeaders,
                data: { maxUses: 1 },
            });
            expect(invite.ok()).toBeTruthy();
            const { code }: { code: string } = await invite.json();

            const signupUrl: string = '/api/auth/sign-up/email';

            // Send two concurrent registrations with the single-use invite code
            const [resp1, resp2]: [APIResponse, APIResponse] = await Promise.all([
                request.post(signupUrl, {
                    headers: apiHeaders,
                    data: {
                        email: 'concurrent1@hemmelig.local',
                        name: 'Concurrent 1',
                        username: 'concurrent1',
                        password: 'ConcurrentPass123!',
                        inviteCode: code,
                    },
                }),
                request.post(signupUrl, {
                    headers: apiHeaders,
                    data: {
                        email: 'concurrent2@hemmelig.local',
                        name: 'Concurrent 2',
                        username: 'concurrent2',
                        password: 'ConcurrentPass123!',
                        inviteCode: code,
                    },
                }),
            ]);

            const statuses: number[] = [resp1.status(), resp2.status()].sort();
            expect(statuses).toEqual([200, 403]);
        } finally {
            await request.post('/api/auth/sign-in/email', {
                headers: apiHeaders,
                data: { email: TEST_USER.email, password: TEST_USER.password },
            });
            await request.put('/api/instance/settings', {
                headers: apiHeaders,
                data: { requireInviteCode: false },
            });
        }
    });
});
