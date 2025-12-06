import { adminClient, twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
    baseURL: window.location.origin,
    plugins: [
        twoFactorClient({
            onTwoFactorRedirect() {
                window.location.href = '/verify-2fa';
            },
        }),
        adminClient(),
    ],
});
