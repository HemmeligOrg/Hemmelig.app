import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { username, admin } from "better-auth/plugins"
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./lib/db";
import config, { type SocialProviderConfig } from "./config";

// Build better-auth social providers configuration dynamically
const buildBetterAuthSocialProviders = () => {
    const providers = config.getSocialProviders();
    const betterAuthProviders: Record<string, { clientId: string; clientSecret: string; tenantId?: string }> = {};

    for (const [provider, providerConfig] of Object.entries(providers)) {
        const typedConfig = providerConfig as SocialProviderConfig;
        betterAuthProviders[provider] = {
            clientId: typedConfig.clientId,
            clientSecret: typedConfig.clientSecret,
            ...(typedConfig.tenantId && { tenantId: typedConfig.tenantId }),
        };
    }

    return betterAuthProviders;
};

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "sqlite",
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: buildBetterAuthSocialProviders(),
    plugins: [
        username(),
        admin()
    ],
    trustedOrigins: config.get('trustedOrigins'),
    hooks: {
        before: async (context) => {
            // Only apply email domain validation to sign-up
            if (context.path !== "/sign-up/email") {
                return;
            }

            const body = context.body as { email?: string };
            const email = body?.email;
            
            if (!email) {
                return;
            }

            // Get instance settings for allowed email domains
            const settings = await prisma.instanceSettings.findFirst({
                select: { allowedEmailDomains: true }
            });

            const allowedDomains = settings?.allowedEmailDomains?.trim();
            
            // If no domains configured, allow all
            if (!allowedDomains) {
                return;
            }

            // Parse comma-separated domains
            const domains = allowedDomains
                .split(',')
                .map(d => d.trim().toLowerCase())
                .filter(d => d.length > 0);

            if (domains.length === 0) {
                return;
            }

            // Extract domain from email
            const emailDomain = email.split('@')[1]?.toLowerCase();

            if (!emailDomain || !domains.includes(emailDomain)) {
                throw new APIError("FORBIDDEN", {
                    message: "Email domain not allowed"
                });
            }
        }
    }
});

// Export enabled social providers for frontend consumption
export const getEnabledSocialProviders = (): string[] => {
    return Object.keys(config.getSocialProviders());
};
