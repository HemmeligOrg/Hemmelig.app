import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { admin, twoFactor, username } from 'better-auth/plugins';
import { genericOAuth } from 'better-auth/plugins/generic-oauth';
import { randomBytes } from 'crypto';
import config, { type SocialProviderConfig } from './config';
import prisma from './lib/db';
import { resolveSettings } from './lib/settings';
import { validatePassword } from './validations/password';

// Generate a unique username from email
const generateUsernameFromEmail = (email: string): string => {
    const localPart = email.split('@')[0] || 'user';
    // Sanitize: only keep alphanumeric characters and underscores
    const sanitized = localPart.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    // Add random suffix to ensure uniqueness (cryptographically secure)
    const randomSuffix = randomBytes(4).toString('hex').substring(0, 6);
    return `${sanitized}_${randomSuffix}`;
};

// Build better-auth social providers configuration dynamically
const buildBetterAuthSocialProviders = () => {
    const providers = config.getSocialProviders();
    const betterAuthProviders: Record<
        string,
        {
            clientId: string;
            clientSecret: string;
            tenantId?: string;
            issuer?: string;
            mapProfileToUser?: (profile: { email?: string; name?: string }) => { username: string };
        }
    > = {};

    for (const [provider, providerConfig] of Object.entries(providers)) {
        const typedConfig = providerConfig as SocialProviderConfig;
        betterAuthProviders[provider] = {
            clientId: typedConfig.clientId,
            clientSecret: typedConfig.clientSecret,
            ...(typedConfig.tenantId && { tenantId: typedConfig.tenantId }),
            ...(typedConfig.issuer && { issuer: typedConfig.issuer }),
            mapProfileToUser: (profile) => ({
                username: generateUsernameFromEmail(profile.email || profile.name || 'user'),
            }),
        };
    }

    return betterAuthProviders;
};

// Build better-auth plugins array
const buildPlugins = () => {
    const plugins: any[] = [username(), admin(), twoFactor()];

    const genericProviders = config.getGenericOAuthProviders();
    if (genericProviders.length > 0) {
        plugins.push(
            genericOAuth({
                // displayName, label and icon are UI-only fields. Better Auth does not get them.
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                config: genericProviders.map(({ displayName, label, icon, ...provider }) => ({
                    ...provider,
                    // Map profile to include username
                    mapProfileToUser: (profile: any) => ({
                        username: generateUsernameFromEmail(
                            profile.email || profile.name || 'user'
                        ),
                    }),
                })),
            })
        );
    }

    return plugins;
};

// Set while the initial setup creates the first administrator. Clients cannot
// set this flag, because no request path writes to it.
export const bootstrap = { inProgress: false };

// Atomically consume an invite code. The conditional update on `uses` makes
// concurrent signups safe: only one request can claim a given use count.
const consumeInviteCode = async (code: string): Promise<void> => {
    const invite = await prisma.inviteCode.findUnique({ where: { code } });

    if (
        !invite ||
        !invite.isActive ||
        (invite.expiresAt && new Date() > invite.expiresAt) ||
        (invite.maxUses !== null && invite.uses >= invite.maxUses)
    ) {
        throw new APIError('BAD_REQUEST', { message: 'Invalid or expired invite code' });
    }

    const updated = await prisma.inviteCode.updateMany({
        where: { id: invite.id, isActive: true, uses: invite.uses },
        data: { uses: { increment: 1 } },
    });

    if (updated.count === 0) {
        throw new APIError('CONFLICT', {
            message: 'Invite code was used by another registration. Try again.',
        });
    }
};

export const auth = betterAuth({
    appName: 'Hemmelig',
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    database: prismaAdapter(prisma, {
        provider: 'sqlite',
    }),
    emailAndPassword: {
        enabled: true,
        // Strength rules for new passwords are enforced by the before hook below
        // and by the Zod schemas on the application routes.
        minPasswordLength: 8,
    },
    socialProviders: buildBetterAuthSocialProviders(),
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: [
                'gitlab',
                'github',
                'google',
                'microsoft',
                'discord',
                'apple',
                'twitter',
                // Add all generic OAuth provider IDs as trusted
                ...config.getGenericOAuthProviders().map((p) => p.providerId),
            ],
        },
    },
    plugins: buildPlugins(),
    trustedOrigins: config.get('trustedOrigins'),
    hooks: {
        before: async (context) => {
            const { path, body } = context as unknown as {
                path?: string;
                body?: { email?: string; password?: string; newPassword?: string };
            };

            if (path === '/sign-up/email') {
                const password = body?.password;

                // Validate password strength for sign-up
                if (password) {
                    const passwordError = validatePassword(password);
                    if (passwordError) {
                        throw new APIError('BAD_REQUEST', { message: passwordError });
                    }
                }

                const settings = await resolveSettings();

                // Check if email/password signup is disabled
                if (settings?.disableEmailPasswordSignup) {
                    throw new APIError('FORBIDDEN', {
                        message:
                            'Email/password registration is disabled. Please use social login.',
                    });
                }

                return;
            }

            // Password changes and resets must meet the same strength rules.
            if (path === '/change-password' || path === '/reset-password') {
                if (body?.newPassword) {
                    const passwordError = validatePassword(body.newPassword);
                    if (passwordError) {
                        throw new APIError('BAD_REQUEST', { message: passwordError });
                    }
                }
            }
        },
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user, context) => {
                    // The initial setup may always create the first administrator.
                    if (bootstrap.inProgress) {
                        return;
                    }

                    // Admin-created users are not self-service registrations.
                    if (context?.path?.startsWith('/admin/')) {
                        return;
                    }

                    const settings = await resolveSettings();

                    if (settings?.allowRegistration === false) {
                        throw new APIError('FORBIDDEN', {
                            message: 'Registration is disabled on this instance.',
                        });
                    }

                    // This instance has no email transport. Only an email that an
                    // identity provider already verified can satisfy this setting.
                    if (settings?.requireEmailVerification && user.emailVerified !== true) {
                        throw new APIError('FORBIDDEN', {
                            message:
                                'Email verification is required. Register with a provider that verifies your email.',
                        });
                    }

                    const allowedDomains = settings?.allowedEmailDomains?.trim();

                    if (allowedDomains) {
                        const domains = allowedDomains
                            .split(',')
                            .map((domain: string) => domain.trim().toLowerCase())
                            .filter((domain: string) => domain.length > 0);
                        const emailDomain = String(user.email).split('@')[1]?.toLowerCase();

                        if (
                            domains.length > 0 &&
                            (!emailDomain || !domains.includes(emailDomain))
                        ) {
                            throw new APIError('FORBIDDEN', {
                                message: 'Email domain not allowed',
                            });
                        }
                    }

                    if (settings?.requireInviteCode) {
                        const rawCode = context?.body?.inviteCode;
                        const code =
                            typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';

                        if (!code) {
                            throw new APIError('BAD_REQUEST', {
                                message: 'Invite code is required',
                            });
                        }

                        await consumeInviteCode(code);
                    }
                },
                after: async (user, context) => {
                    if (context?.path?.startsWith('/admin/')) {
                        return;
                    }

                    const rawCode = context?.body?.inviteCode;
                    const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';

                    if (!code) {
                        return;
                    }

                    try {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { inviteCodeUsed: code },
                        });
                    } catch (error) {
                        console.error('Failed to record invite code usage:', error);
                    }
                },
            },
        },
    },
});

// Export enabled social providers for frontend consumption
export const getEnabledSocialProviders = (): string[] => {
    const standardProviders = Object.keys(config.getSocialProviders());
    const genericProviders = config.getGenericOAuthProviders().map((p) => p.providerId);
    return [...standardProviders, ...genericProviders];
};

export interface SocialProviderDetails {
    id: string;
    /** True for providers of the generic OAuth plugin. */
    generic: boolean;
    displayName?: string;
    label?: string;
    icon?: string;
}

/** Returns the enabled providers with the optional button text and icon. */
export const getSocialProviderDetails = (): SocialProviderDetails[] => {
    const standardProviders = Object.keys(config.getSocialProviders()).map((id) => ({
        id,
        generic: false,
    }));
    const genericProviders = config
        .getGenericOAuthProviders()
        .map(({ providerId, displayName, label, icon }) => ({
            id: providerId,
            generic: true,
            ...(displayName && { displayName }),
            ...(label && { label }),
            ...(icon && { icon }),
        }));
    return [...standardProviders, ...genericProviders];
};
