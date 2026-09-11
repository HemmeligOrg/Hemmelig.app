import { expect, test, TEST_USER } from './fixtures';

test.describe('Invite-only registration', () => {
    test('blocks sign-up without a valid invite code when required', async ({ page, request }) => {
        // Sign in as the admin test user
        const login = await request.post('/api/auth/sign-in/email', {
            data: { email: TEST_USER.email, password: TEST_USER.password },
        });
        if (!login.ok()) {
            console.error('sign-in response:', login.status(), await login.text());
        }
        expect(login.ok()).toBeTruthy();

        // Enable invite-only registration
        const enable = await request.put('/api/instance/settings', {
            data: { requireInviteCode: true },
        });
        expect(enable.ok()).toBeTruthy();

        try {
            const signupUrl = '/api/auth/sign-up/email';
            const baseUser = {
                name: 'invitee',
                username: 'inviteetest',
                password: 'InviteTestPassword123!',
            };

            // No invite code -> forbidden
            const signupHeaders = { Origin: 'http://localhost:5173' };

            // No invite code -> forbidden
            const noCode = await request.post(signupUrl, {
                headers: signupHeaders,
                data: { email: 'no-invite@hemmelig.local', ...baseUser },
            });
            expect(noCode.status()).toBe(403);

            // Invalid invite code -> forbidden
            const badCode = await request.post(signupUrl, {
                headers: signupHeaders,
                data: {
                    email: 'bad-invite@hemmelig.local',
                    ...baseUser,
                    inviteCode: 'NOTAREALCODE',
                },
            });
            expect(badCode.status()).toBe(403);

            // Valid single-use invite code -> sign-up succeeds
            const invite = await request.post('/api/invites', {
                data: { maxUses: 1 },
            });
            expect(invite.ok()).toBeTruthy();
            const { code } = await invite.json();

            const withCode = await request.post(signupUrl, {
                headers: signupHeaders,
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
            const reused = await request.post(signupUrl, {
                headers: signupHeaders,
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
            // Restore the setting so other tests are unaffected
            await request.put('/api/instance/settings', {
                data: { requireInviteCode: false },
            });
        }
    });
});
