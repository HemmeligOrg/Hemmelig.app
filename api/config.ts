import dlv from 'dlv';

const isProduction = process.env.NODE_ENV === 'production';

// Helper to parse number from env, returns undefined if not set or invalid
const parseNumber = (value: string | undefined): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
};

// Helper to parse boolean from env, returns undefined if not set
const parseBoolean = (value: string | undefined): boolean | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    return value.toLowerCase() === 'true';
};

// Social provider configuration type
export interface SocialProviderConfig {
    clientId: string;
    clientSecret: string;
    tenantId?: string; // For Microsoft/Azure AD
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

const config = {
    server: {
        port: Number(process.env.HEMMELIG_PORT) || 3000,
    },
    file: {
        maxSize: (Number(process.env.HEMMELIG_MAX_FILE_SIZE_MB) || 10) * 1024 * 1024, // Default 10MB
    },
    trustedOrigins: [
        "https://hemmelig.app",
        ...(!isProduction ? ["http://localhost:5173"] : []),
        process.env.HEMMELIG_TRUSTED_ORIGIN || "",
    ].filter(Boolean),
    general: {
        instanceName: process.env.HEMMELIG_INSTANCE_NAME,
        instanceDescription: process.env.HEMMELIG_INSTANCE_DESCRIPTION,
        allowRegistration: parseBoolean(process.env.HEMMELIG_ALLOW_REGISTRATION),
        requireEmailVerification: parseBoolean(process.env.HEMMELIG_REQUIRE_EMAIL_VERIFICATION),
        maxSecretsPerUser: parseNumber(process.env.HEMMELIG_MAX_SECRETS_PER_USER),
        defaultSecretExpiration: parseNumber(process.env.HEMMELIG_DEFAULT_SECRET_EXPIRATION),
        maxSecretSize: parseNumber(process.env.HEMMELIG_MAX_SECRET_SIZE),
    },
    security: {
        allowPasswordProtection: parseBoolean(process.env.HEMMELIG_ALLOW_PASSWORD_PROTECTION),
        allowIpRestriction: parseBoolean(process.env.HEMMELIG_ALLOW_IP_RESTRICTION),
        maxPasswordAttempts: parseNumber(process.env.HEMMELIG_MAX_PASSWORD_ATTEMPTS),
        sessionTimeout: parseNumber(process.env.HEMMELIG_SESSION_TIMEOUT),
        enableRateLimiting: parseBoolean(process.env.HEMMELIG_ENABLE_RATE_LIMITING),
        rateLimitRequests: parseNumber(process.env.HEMMELIG_RATE_LIMIT_REQUESTS),
        rateLimitWindow: parseNumber(process.env.HEMMELIG_RATE_LIMIT_WINDOW),
    },
    analytics: {
        enabled: parseBoolean(process.env.HEMMELIG_ANALYTICS_ENABLED) ?? true,
        hmacSecret: process.env.HEMMELIG_ANALYTICS_HMAC_SECRET || 'default-analytics-secret-change-me',
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
};

