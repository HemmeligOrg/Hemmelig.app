import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { admin, twoFactor, username } from 'better-auth/plugins';
import { genericOAuth } from 'better-auth/plugins/generic-oauth';
import { randomBytes } from 'crypto';
import config, { type SocialProviderConfig } from './config';
import prisma from './lib/db';
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
                config: genericProviders.map((provider) => ({
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

export const auth = betterAuth({
    appName: 'Hemmelig',
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    database: prismaAdapter(prisma, {
        provider: 'sqlite',
    }),
    emailAndPassword: {
        enabled: true,
        // Set to 1 so better-auth doesn't reject weak current passwords during password change.
        // Password strength for new passwords is enforced by our Zod schema (updatePasswordSchema)
        // and for sign-up by the before hook below.
        minPasswordLength: 1,
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
            // Only apply validation to email/password sign-up
            if (context.path !== '/sign-up/email') {
                return;
            }

            const body = context.body as {
                email?: string;
                password?: string;
                inviteCode?: string;
            };
            const email = body?.email;
            const password = body?.password;

            if (!email) {
                return;
            }

            // Validate password strength for sign-up
            if (password) {
                const passwordError = validatePassword(password);
                if (passwordError) {
                    throw new APIError('BAD_REQUEST', { message: passwordError });
                }
            }

            // Get instance settings
            const settings = await prisma.instanceSettings.findFirst({
                select: {
                    allowedEmailDomains: true,
                    disableEmailPasswordSignup: true,
                    requireInviteCode: true,
                },
            });

            // Check if email/password signup is disabled
            if (settings?.disableEmailPasswordSignup) {
                throw new APIError('FORBIDDEN', {
                    message: 'Email/password registration is disabled. Please use social login.',
                });
            }

            const allowedDomains = settings?.allowedEmailDomains?.trim();

            // Check email domain restrictions if configured
            if (allowedDomains) {
                const domains = allowedDomains
                    .split(',')
                    .map((d) => d.trim().toLowerCase())
                    .filter((d) => d.length > 0);

                if (domains.length > 0) {
                    const emailDomain = email.split('@')[1]?.toLowerCase();
                    if (!emailDomain || !domains.includes(emailDomain)) {
                        throw new APIError('FORBIDDEN', {
                            message: 'Email domain not allowed',
                        });
                    }
                }
            }

            // Enforce invite-only registration: validate the code in before-hook without
            // consuming it, so that registration errors (e.g. domain/password/duplicate) do not burn it.
            const inviteCode = body?.inviteCode?.trim();
            if (settings?.requireInviteCode && !inviteCode) {
                throw new APIError('FORBIDDEN', {
                    message: 'An invite code is required to register.',
                });
            }

            if (inviteCode) {
                const invite = await prisma.inviteCode.findUnique({
                    where: { code: inviteCode.toUpperCase() },
                });

                if (!invite || !invite.isActive) {
                    throw new APIError('FORBIDDEN', { message: 'Invalid invite code.' });
                }

                if (invite.expiresAt && new Date() > invite.expiresAt) {
                    throw new APIError('FORBIDDEN', { message: 'Invite code has expired.' });
                }

                if (invite.maxUses && invite.uses >= invite.maxUses) {
                    throw new APIError('FORBIDDEN', {
                        message: 'Invite code has reached maximum uses.',
                    });
                }
            }
        },
        after: async (context) => {
            // Atomically consume invite code and associate its ID with user after successful registration
            if (context.path === '/sign-up/email') {
                const inviteCode = (
                    context.body as { inviteCode?: string } | undefined
                )?.inviteCode?.trim();

                const returned = (context as { context?: { returned?: unknown } }).context
                    ?.returned as { user?: { id?: string }; id?: string } | undefined;
                const userId = returned?.user?.id ?? returned?.id;

                if (inviteCode && userId) {
                    const invite = await prisma.inviteCode.findUnique({
                        where: { code: inviteCode.toUpperCase() },
                    });

                    if (invite) {
                        const consumed = await prisma.inviteCode.updateMany({
                            where: {
                                id: invite.id,
                                isActive: true,
                                uses: invite.maxUses ? { lt: invite.maxUses } : undefined,
                                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                            },
                            data: { uses: { increment: 1 } },
                        });

                        if (consumed.count > 0) {
                            await prisma.user
                                .update({
                                    where: { id: userId },
                                    data: { inviteCodeUsed: invite.id },
                                })
                                .catch(() => {
                                    // Tracking only; never fail the sign-up because of it
                                });
                        } else {
                            // Concurrently exhausted while creating user; rollback user creation
                            await prisma.user.delete({ where: { id: userId } }).catch(() => {});
                            throw new APIError('FORBIDDEN', {
                                message: 'Invite code has reached maximum uses.',
                            });
                        }
                    }
                }
            }

            // better-auth requires after-hooks to return a result object
            return { context: {} };
        },
    },
});

// Export enabled social providers for frontend consumption
export const getEnabledSocialProviders = (): string[] => {
    const standardProviders = Object.keys(config.getSocialProviders());
    const genericProviders = config.getGenericOAuthProviders().map((p) => p.providerId);
    return [...standardProviders, ...genericProviders];
};
