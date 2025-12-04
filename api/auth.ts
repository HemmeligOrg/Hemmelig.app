import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { admin, twoFactor, username } from 'better-auth/plugins';
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
            mapProfileToUser?: (profile: { email?: string; name?: string }) => { username: string };
        }
    > = {};

    for (const [provider, providerConfig] of Object.entries(providers)) {
        const typedConfig = providerConfig as SocialProviderConfig;
        betterAuthProviders[provider] = {
            clientId: typedConfig.clientId,
            clientSecret: typedConfig.clientSecret,
            ...(typedConfig.tenantId && { tenantId: typedConfig.tenantId }),
            mapProfileToUser: (profile) => ({
                username: generateUsernameFromEmail(profile.email || profile.name || 'user'),
            }),
        };
    }

    return betterAuthProviders;
};

export const auth = betterAuth({
    appName: 'Hemmelig',
    database: prismaAdapter(prisma, {
        provider: 'sqlite',
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: buildBetterAuthSocialProviders(),
    plugins: [username(), admin(), twoFactor()],
    trustedOrigins: config.get('trustedOrigins'),
    hooks: {
        before: async (context) => {
            // Only apply email domain validation to sign-up
            if (context.path !== '/sign-up/email') {
                return;
            }

            const body = context.body as { email?: string };
            const email = body?.email;

            if (!email) {
                return;
            }

            // Get instance settings for allowed email domains
            const settings = await prisma.instanceSettings.findFirst({
                select: { allowedEmailDomains: true },
            });

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
    return Object.keys(config.getSocialProviders());
};
