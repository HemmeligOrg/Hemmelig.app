import dlv from 'dlv';

const isProduction = process.env.NODE_ENV === 'production';

// Helper to parse boolean from env, returns undefined if not set
const parseBoolean = (value: string | undefined): boolean | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    return value.toLowerCase() === 'true';
};

// Helper to parse integer from env, returns undefined if not set
const parseInteger = (value: string | undefined): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
};

// Social provider configuration type
export interface SocialProviderConfig {
    clientId: string;
    clientSecret: string;
    tenantId?: string; // For Microsoft/Azure AD
    issuer?: string; // For self-hosted instances (e.g., GitLab)
}

// Build social providers config dynamically from env vars
const buildSocialProviders = () => {
    const providers: Record<string, SocialProviderConfig> = {};

    // GitHub
    if (process.env.HEMMELIG_AUTH_GITHUB_ID && process.env.HEMMELIG_AUTH_GITHUB_SECRET) {
        providers.github = {
            clientId: process.env.HEMMELIG_AUTH_GITHUB_ID,
            clientSecret: process.env.HEMMELIG_AUTH_GITHUB_SECRET,
        };
    }

    // Google
    if (process.env.HEMMELIG_AUTH_GOOGLE_ID && process.env.HEMMELIG_AUTH_GOOGLE_SECRET) {
        providers.google = {
            clientId: process.env.HEMMELIG_AUTH_GOOGLE_ID,
            clientSecret: process.env.HEMMELIG_AUTH_GOOGLE_SECRET,
        };
    }

    // Microsoft (Azure AD)
    if (process.env.HEMMELIG_AUTH_MICROSOFT_ID && process.env.HEMMELIG_AUTH_MICROSOFT_SECRET) {
        providers.microsoft = {
            clientId: process.env.HEMMELIG_AUTH_MICROSOFT_ID,
            clientSecret: process.env.HEMMELIG_AUTH_MICROSOFT_SECRET,
            tenantId: process.env.HEMMELIG_AUTH_MICROSOFT_TENANT_ID,
        };
    }

    // Discord
    if (process.env.HEMMELIG_AUTH_DISCORD_ID && process.env.HEMMELIG_AUTH_DISCORD_SECRET) {
        providers.discord = {
            clientId: process.env.HEMMELIG_AUTH_DISCORD_ID,
            clientSecret: process.env.HEMMELIG_AUTH_DISCORD_SECRET,
        };
    }

    // GitLab
    if (process.env.HEMMELIG_AUTH_GITLAB_ID && process.env.HEMMELIG_AUTH_GITLAB_SECRET) {
        providers.gitlab = {
            clientId: process.env.HEMMELIG_AUTH_GITLAB_ID,
            clientSecret: process.env.HEMMELIG_AUTH_GITLAB_SECRET,
            issuer: process.env.HEMMELIG_AUTH_GITLAB_ISSUER,
        };
    }

    // Apple
    if (process.env.HEMMELIG_AUTH_APPLE_ID && process.env.HEMMELIG_AUTH_APPLE_SECRET) {
        providers.apple = {
            clientId: process.env.HEMMELIG_AUTH_APPLE_ID,
            clientSecret: process.env.HEMMELIG_AUTH_APPLE_SECRET,
        };
    }

    // Twitter/X
    if (process.env.HEMMELIG_AUTH_TWITTER_ID && process.env.HEMMELIG_AUTH_TWITTER_SECRET) {
        providers.twitter = {
            clientId: process.env.HEMMELIG_AUTH_TWITTER_ID,
            clientSecret: process.env.HEMMELIG_AUTH_TWITTER_SECRET,
        };
    }

    return providers;
};

const socialProviders = buildSocialProviders();

// Managed mode: all settings are controlled via environment variables
const isManaged = parseBoolean(process.env.HEMMELIG_MANAGED) ?? false;

// Managed mode settings (only used when HEMMELIG_MANAGED=true)
const managedSettings = isManaged
    ? {
          // General settings
          instanceName: process.env.HEMMELIG_INSTANCE_NAME ?? '',
          instanceDescription: process.env.HEMMELIG_INSTANCE_DESCRIPTION ?? '',
          allowRegistration: parseBoolean(process.env.HEMMELIG_ALLOW_REGISTRATION) ?? true,
          requireEmailVerification:
              parseBoolean(process.env.HEMMELIG_REQUIRE_EMAIL_VERIFICATION) ?? false,
          defaultSecretExpiration:
              parseInteger(process.env.HEMMELIG_DEFAULT_SECRET_EXPIRATION) ?? 72,
          maxSecretSize: parseInteger(process.env.HEMMELIG_MAX_SECRET_SIZE) ?? 1024,
          importantMessage: process.env.HEMMELIG_IMPORTANT_MESSAGE ?? '',

          // Security settings
          allowPasswordProtection:
              parseBoolean(process.env.HEMMELIG_ALLOW_PASSWORD_PROTECTION) ?? true,
          allowIpRestriction: parseBoolean(process.env.HEMMELIG_ALLOW_IP_RESTRICTION) ?? true,
          enableRateLimiting: parseBoolean(process.env.HEMMELIG_ENABLE_RATE_LIMITING) ?? true,
          rateLimitRequests: parseInteger(process.env.HEMMELIG_RATE_LIMIT_REQUESTS) ?? 100,
          rateLimitWindow: parseInteger(process.env.HEMMELIG_RATE_LIMIT_WINDOW) ?? 60,

          // Organization settings
          requireInviteCode: parseBoolean(process.env.HEMMELIG_REQUIRE_INVITE_CODE) ?? false,
          allowedEmailDomains: process.env.HEMMELIG_ALLOWED_EMAIL_DOMAINS ?? '',
          requireRegisteredUser:
              parseBoolean(process.env.HEMMELIG_REQUIRE_REGISTERED_USER) ?? false,
          disableEmailPasswordSignup:
              parseBoolean(process.env.HEMMELIG_DISABLE_EMAIL_PASSWORD_SIGNUP) ?? false,

          // Webhook settings
          webhookEnabled: parseBoolean(process.env.HEMMELIG_WEBHOOK_ENABLED) ?? false,
          webhookUrl: process.env.HEMMELIG_WEBHOOK_URL ?? '',
          webhookSecret: process.env.HEMMELIG_WEBHOOK_SECRET ?? '',
          webhookOnView: parseBoolean(process.env.HEMMELIG_WEBHOOK_ON_VIEW) ?? true,
          webhookOnBurn: parseBoolean(process.env.HEMMELIG_WEBHOOK_ON_BURN) ?? true,

          // Metrics settings
          metricsEnabled: parseBoolean(process.env.HEMMELIG_METRICS_ENABLED) ?? false,
          metricsSecret: process.env.HEMMELIG_METRICS_SECRET ?? '',

          // File upload settings
          allowFileUploads: parseBoolean(process.env.HEMMELIG_ALLOW_FILE_UPLOADS) ?? true,
      }
    : null;

const config = {
    server: {
        port: Number(process.env.HEMMELIG_PORT) || 3000,
    },
    trustedOrigins: [
        ...(!isProduction ? ['http://localhost:5173'] : []),
        process.env.HEMMELIG_TRUSTED_ORIGIN || '',
    ].filter(Boolean),
    general: {
        instanceName: process.env.HEMMELIG_INSTANCE_NAME,
        instanceDescription: process.env.HEMMELIG_INSTANCE_DESCRIPTION,
        allowRegistration: parseBoolean(process.env.HEMMELIG_ALLOW_REGISTRATION),
    },
    security: {
        allowPasswordProtection: parseBoolean(process.env.HEMMELIG_ALLOW_PASSWORD_PROTECTION),
        allowIpRestriction: parseBoolean(process.env.HEMMELIG_ALLOW_IP_RESTRICTION),
    },
    analytics: {
        enabled: parseBoolean(process.env.HEMMELIG_ANALYTICS_ENABLED) ?? true,
        hmacSecret:
            process.env.HEMMELIG_ANALYTICS_HMAC_SECRET || 'default-analytics-secret-change-me',
    },
    socialProviders,
};

/**
 * A type-safe utility to get a value from the configuration.
 * Its return type is inferred from the type of the default value.
 * @param path The dot-notation path to the config value (e.g., 'server.port').
 * @param defaultValue A default value to return if the path is not found.
 * @returns The found configuration value or the default value.
 */
function get<T>(path: string, defaultValue?: T): T {
    return dlv(config, path, defaultValue) as T;
}

// Export the get function and social providers helper
export default {
    get,
    getSocialProviders: () => config.socialProviders,
    isManaged: () => isManaged,
    getManagedSettings: () => managedSettings,
};
