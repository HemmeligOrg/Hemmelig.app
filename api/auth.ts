import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { admin, twoFactor, username } from 'better-auth/plugins';
import { genericOAuth } from 'better-auth/plugins/generic-oauth';
import type { BetterAuthPlugin } from 'better-auth/types';
import { randomBytes } from 'crypto';
import config, { type SocialProviderConfig } from './config';
import { hashSetupClaimToken, safeSecretEqual, SETUP_CLAIM_ID } from './lib/claim';
import prisma from './lib/db';
import { consumeInviteCode } from './lib/invite';
import { resolveSettings } from './lib/settings';
import { deleteUserWithRetries } from './lib/user-rollback';
import { validatePassword } from './validations/password';

export const SETUP_HEADER = 'x-hemmelig-setup-token';
export const SETUP_CLAIM_HEADER = 'x-setup-claim-token';
export const SETUP_TOKEN = randomBytes(32).toString('hex');

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
    const plugins: BetterAuthPlugin[] = [username(), admin(), twoFactor()];

    const genericProviders = config.getGenericOAuthProviders();
    if (genericProviders.length > 0) {
        plugins.push(
            genericOAuth({
                config: genericProviders.map((provider) => ({
                    ...provider,
                    // Map profile to include username
                    mapProfileToUser: (profile: { email?: string; name?: string }) => ({
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

/**
 * Validates that an incoming request on an uninitialized instance holds both the internal setup token
 * and an active, unexpired setup claim token matching the database sentinel claim.
 *
 * @param headers - Request headers containing setup tokens.
 */
const validateInitialSetupClaim = async (
    headers?: Headers | { get(name: string): string | null | undefined } | null
): Promise<void> => {
    const setupToken = headers?.get(SETUP_HEADER);
    const claimToken = headers?.get(SETUP_CLAIM_HEADER);

    // Compare in constant time (CWE-208); a length mismatch only leaks the length.
    if (!setupToken || !safeSecretEqual(setupToken, SETUP_TOKEN) || !claimToken) {
        throw new APIError('FORBIDDEN', {
            message: 'Initial setup must be completed before registration is available.',
        });
    }

    // Only the SHA-256 digest is ever compared or stored (CWE-312).
    const claimTokenHash = hashSetupClaimToken(claimToken);

    const claim = await prisma.verification.findUnique({
        where: { id: SETUP_CLAIM_ID },
    });

    if (!claim || !safeSecretEqual(claim.value, claimTokenHash) || claim.expiresAt < new Date()) {
        throw new APIError('FORBIDDEN', {
            message: 'Initial setup must be completed before registration is available.',
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
    databaseHooks: {
        user: {
            create: {
                before: async (_user, context) => {
                    // Allow admin user creation by existing admin
                    if (context?.path === '/admin/create-user') {
                        return;
                    }

                    // On an empty deployment, initial setup requires valid setup token and claim
                    if ((await prisma.user.count()) === 0) {
                        // Bootstrap must only ever happen through the email setup path.
                        // Reject every other creation path (social/generic OAuth) explicitly
                        // so a fresh instance can never be claimed by an uninvited social
                        // account, regardless of what headers the request carries.
                        if (context?.path !== '/sign-up/email') {
                            throw new APIError('FORBIDDEN', {
                                message:
                                    'Initial setup must be completed before social sign-in is available.',
                            });
                        }
                        await validateInitialSetupClaim(context?.headers);
                        return;
                    }

                    const settings = (await resolveSettings()) as {
                        allowRegistration?: boolean | null;
                        requireInviteCode?: boolean | null;
                    } | null;

                    // Check if registration is disabled
                    if (settings?.allowRegistration === false) {
                        throw new APIError('FORBIDDEN', {
                            message: 'Registration is disabled.',
                        });
                    }

                    // Social login / OAuth does not provide an invite code; block new user creation via social when invite code is required
                    if (settings?.requireInviteCode && context?.path !== '/sign-up/email') {
                        throw new APIError('FORBIDDEN', {
                            message: 'An invite code is required to register.',
                        });
                    }
                },
            },
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

            const userCount = await prisma.user.count();
            if (userCount === 0) {
                await validateInitialSetupClaim(context.headers);
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
            const settings = (await resolveSettings()) as {
                allowedEmailDomains?: string | null;
                disableEmailPasswordSignup?: boolean | null;
                allowRegistration?: boolean | null;
                requireInviteCode?: boolean | null;
            } | null;

            const isInitialSetup = userCount === 0;

            // Check if registration is disabled
            if (settings?.allowRegistration === false && !isInitialSetup) {
                throw new APIError('FORBIDDEN', {
                    message: 'Registration is disabled.',
                });
            }

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

            if (settings?.requireInviteCode && !isInitialSetup && !inviteCode) {
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

                if (typeof invite.maxUses === 'number' && invite.uses >= invite.maxUses) {
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

                const settings = (await resolveSettings()) as {
                    requireInviteCode?: boolean | null;
                } | null;

                /**
                 * Rolls back user creation if invite verification, consumption, or
                 * attribution fails. Delegates to a retrying delete helper; a P2025
                 * (user already gone) counts as success. If the delete persistently
                 * fails the user record survives, so this fails loudly instead of
                 * returning a success-looking response (fail-closed).
                 *
                 * @param id - The ID of the user record to delete.
                 */
                const rollbackUser = async (id: string): Promise<void> => {
                    if (!(await deleteUserWithRetries(id))) {
                        throw new APIError('INTERNAL_SERVER_ERROR', {
                            message: 'Failed to rollback user after invite processing error.',
                        });
                    }
                };

                const isInitialSetup =
                    safeSecretEqual(context.headers?.get(SETUP_HEADER) ?? '', SETUP_TOKEN) &&
                    (await prisma.user.count()) <= 1;

                // Roll back user creation if invite code was required but absent or userId missing
                if (settings?.requireInviteCode && !isInitialSetup && (!inviteCode || !userId)) {
                    if (userId) {
                        await rollbackUser(userId);
                    }
                    throw new APIError('FORBIDDEN', {
                        message: 'An invite code is required to register.',
                    });
                }

                if (inviteCode && userId) {
                    const invite = await prisma.inviteCode.findUnique({
                        where: { code: inviteCode.toUpperCase() },
                    });

                    // If invite code vanished or became invalid -> rollback user immediately
                    if (!invite || !invite.isActive) {
                        await rollbackUser(userId);
                        throw new APIError('FORBIDDEN', { message: 'Invalid invite code.' });
                    }

                    if (invite.expiresAt && new Date() > invite.expiresAt) {
                        await rollbackUser(userId);
                        throw new APIError('FORBIDDEN', { message: 'Invite code has expired.' });
                    }

                    if (typeof invite.maxUses === 'number' && invite.uses >= invite.maxUses) {
                        await rollbackUser(userId);
                        throw new APIError('FORBIDDEN', {
                            message: 'Invite code has reached maximum uses.',
                        });
                    }

                    try {
                        await consumeInviteCode(invite, userId);
                    } catch (err: unknown) {
                        // Rollback user creation on any failure during consumption or attribution
                        await rollbackUser(userId);

                        if (err instanceof Error && err.message === 'INVITE_EXHAUSTED') {
                            throw new APIError('FORBIDDEN', {
                                message: 'Invite code has reached maximum uses.',
                            });
                        }

                        console.error('Error during invite consumption transaction:', err);
                        throw new APIError('FORBIDDEN', {
                            message: 'Failed to process invite code.',
                        });
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
