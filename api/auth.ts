import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { admin, twoFactor, username } from 'better-auth/plugins';
import { genericOAuth } from 'better-auth/plugins/generic-oauth';
import config, { type SocialProviderConfig } from './config';
import prisma from './lib/db';

// Generate a unique username from email
const generateUsernameFromEmail = (email: string): string => {
    const localPart = email.split('@')[0] || 'user';
    // Sanitize: only keep alphanumeric characters and underscores
    const sanitized = localPart.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 8);
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

            const body = context.body as { email?: string };
            const email = body?.email;

            if (!email) {
                return;
            }

            // Get instance settings
            const settings = await prisma.instanceSettings.findFirst({
                select: { allowedEmailDomains: true, disableEmailPasswordSignup: true },
            });

            // Check if email/password signup is disabled
            if (settings?.disableEmailPasswordSignup) {
                throw new APIError('FORBIDDEN', {
                    message: 'Email/password registration is disabled. Please use social login.',
                });
            }

            const allowedDomains = settings?.allowedEmailDomains?.trim();

            // If no domains configured, allow all
            if (!allowedDomains) {
                return;
            }

            // Parse comma-separated domains
            const domains = allowedDomains
                .split(',')
                .map((d) => d.trim().toLowerCase())
                .filter((d) => d.length > 0);

            if (domains.length === 0) {
                return;
            }

            // Extract domain from email
            const emailDomain = email.split('@')[1]?.toLowerCase();

            if (!emailDomain || !domains.includes(emailDomain)) {
                throw new APIError('FORBIDDEN', {
                    message: 'Email domain not allowed',
                });
            }
        },
    },
});

// Export enabled social providers for frontend consumption
export const getEnabledSocialProviders = (): string[] => {
    const standardProviders = Object.keys(config.getSocialProviders());
    const genericProviders = config.getGenericOAuthProviders().map((p) => p.providerId);
    return [...standardProviders, ...genericProviders];
};
