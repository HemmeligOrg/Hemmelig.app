import { randomBytes } from 'crypto';
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

export type DefaultTheme = 'light' | 'dark' | 'system';

const DEFAULT_THEMES: readonly DefaultTheme[] = ['light', 'dark', 'system'];

// Returns the theme when the value is a known theme, otherwise undefined.
const parseTheme = (value: string | undefined): DefaultTheme | undefined => {
    const theme = value?.trim().toLowerCase();
    return DEFAULT_THEMES.find((known) => known === theme);
};

// Keeps the default max views in the range that the secret API accepts.
const clampViews = (value: number | undefined): number | undefined =>
    value === undefined ? undefined : Math.min(9999, Math.max(1, value));

// Social provider configuration type
export interface SocialProviderConfig {
    clientId: string;
    clientSecret: string;
    tenantId?: string; // For Microsoft/Azure AD
    issuer?: string; // For self-hosted instances (e.g., GitLab)
}

// Generic OAuth provider configuration type (for better-auth genericOAuth plugin)
export interface GenericOAuthProviderConfig {
    providerId: string;
    discoveryUrl?: string;
    authorizationUrl?: string;
    tokenUrl?: string;
    userInfoUrl?: string;
    clientId: string;
    clientSecret: string;
    scopes?: string[];
    pkce?: boolean;
    /** Name in the login button text, for example "Company ID". UI only. */
    displayName?: string;
    /** Full login button text that replaces the default text. UI only. */
    label?: string;
    /** Button icon as a base64 data URI (PNG, SVG or WebP). UI only. */
    icon?: string;
}

// Limits for the UI-only fields of a generic OAuth provider.
const MAX_PROVIDER_TEXT_LENGTH = 64;
// The same limit as the instance logo: 512 KB of image data in base64.
const MAX_PROVIDER_ICON_LENGTH = 700000;
const PROVIDER_ICON_PATTERN = /^data:image\/(png|svg\+xml|webp);base64,[A-Za-z0-9+/]+=*$/;

/** Returns a trimmed text value, or undefined when the value is not usable. */
const readProviderText = (value: unknown, field: string, providerId: string) => {
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || !value.trim()) {
        console.error(`Ignoring "${field}" for generic OAuth provider "${providerId}": not text`);
        return undefined;
    }
    const text = value.trim();
    if (text.length > MAX_PROVIDER_TEXT_LENGTH) {
        console.error(
            `Ignoring "${field}" for generic OAuth provider "${providerId}": longer than ${MAX_PROVIDER_TEXT_LENGTH} characters`
        );
        return undefined;
    }
    return text;
};

/**
 * Returns the icon when it is a base64 data URI of an allowed image type.
 * The CSP allows images only from the app itself and data URIs, so other
 * values such as remote URLs are rejected.
 */
const readProviderIcon = (value: unknown, providerId: string) => {
    if (value === undefined) return undefined;
    if (
        typeof value !== 'string' ||
        value.length > MAX_PROVIDER_ICON_LENGTH ||
        !PROVIDER_ICON_PATTERN.test(value)
    ) {
        console.error(
            `Ignoring "icon" for generic OAuth provider "${providerId}": use a base64 data URI (PNG, SVG or WebP) smaller than 512 KB`
        );
        return undefined;
    }
    return value;
};

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

// Build generic OAuth providers from JSON env var
const buildGenericOAuthProviders = (): GenericOAuthProviderConfig[] => {
    const genericOAuthEnv = process.env.HEMMELIG_AUTH_GENERIC_OAUTH;

    if (!genericOAuthEnv) {
        return [];
    }

    try {
        const parsed = JSON.parse(genericOAuthEnv);
        if (!Array.isArray(parsed)) {
            console.error('HEMMELIG_AUTH_GENERIC_OAUTH must be a JSON array');
            return [];
        }

        // Validate each provider config
        const valid = (parsed as Record<string, unknown>[]).filter((provider) => {
            if (!provider.providerId || !provider.clientId || !provider.clientSecret) {
                console.error(
                    `Invalid generic OAuth provider config: missing required fields (providerId, clientId, or clientSecret)`
                );
                return false;
            }

            // Must have either discoveryUrl OR all three URLs (authorization, token, userInfo)
            const hasDiscoveryUrl = !!provider.discoveryUrl;
            const hasManualUrls = !!(
                provider.authorizationUrl &&
                provider.tokenUrl &&
                provider.userInfoUrl
            );

            if (!hasDiscoveryUrl && !hasManualUrls) {
                console.error(
                    `Invalid generic OAuth provider config for "${provider.providerId}": must provide either discoveryUrl OR all of (authorizationUrl, tokenUrl, userInfoUrl)`
                );
                return false;
            }

            return true;
        }) as unknown as GenericOAuthProviderConfig[];

        // Keep the UI-only fields only when they are valid. An invalid value
        // does not disable the provider.
        return valid.map((provider) => {
            const { displayName, label, icon, ...rest } = provider;
            const cleanDisplayName = readProviderText(
                displayName,
                'displayName',
                provider.providerId
            );
            const cleanLabel = readProviderText(label, 'label', provider.providerId);
            const cleanIcon = readProviderIcon(icon, provider.providerId);
            return {
                ...rest,
                ...(cleanDisplayName && { displayName: cleanDisplayName }),
                ...(cleanLabel && { label: cleanLabel }),
                ...(cleanIcon && { icon: cleanIcon }),
            };
        });
    } catch (error) {
        console.error('Failed to parse HEMMELIG_AUTH_GENERIC_OAUTH:', error);
        return [];
    }
};

const socialProviders = buildSocialProviders();
const genericOAuthProviders = buildGenericOAuthProviders();

// UI option: hide the username and password form on the login page when a
// social provider is enabled. The server still accepts password sign-in.
const hidePasswordLogin = parseBoolean(process.env.HEMMELIG_HIDE_PASSWORD_LOGIN) ?? false;

// Managed mode: all settings are controlled via environment variables
const isManaged = parseBoolean(process.env.HEMMELIG_MANAGED) ?? false;

// Managed mode settings (only used when HEMMELIG_MANAGED=true)
const managedSettings = isManaged
    ? {
          // General settings
          instanceName: process.env.HEMMELIG_INSTANCE_NAME ?? '',
          instanceDescription: process.env.HEMMELIG_INSTANCE_DESCRIPTION ?? '',
          instanceLogo: process.env.HEMMELIG_INSTANCE_LOGO ?? '',
          instanceLogoDark: process.env.HEMMELIG_INSTANCE_LOGO_DARK ?? '',
          defaultTheme: parseTheme(process.env.HEMMELIG_DEFAULT_THEME) ?? 'dark',
          allowRegistration: parseBoolean(process.env.HEMMELIG_ALLOW_REGISTRATION) ?? true,
          requireEmailVerification:
              parseBoolean(process.env.HEMMELIG_REQUIRE_EMAIL_VERIFICATION) ?? false,
          defaultSecretExpiration:
              parseInteger(process.env.HEMMELIG_DEFAULT_SECRET_EXPIRATION) ?? 72,
          defaultMaxViews: clampViews(parseInteger(process.env.HEMMELIG_DEFAULT_MAX_VIEWS)) ?? 1,
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
        requestTimeout: parseInteger(process.env.HEMMELIG_REQUEST_TIMEOUT) ?? 15,
        // Proxy addresses that may set forwarded client IP headers.
        trustedProxies: (process.env.HEMMELIG_TRUSTED_PROXIES || '')
            .split(',')
            .map((proxy) => proxy.trim())
            .filter(Boolean),
    },
    trustedOrigins: [
        ...(!isProduction ? ['http://localhost:5173'] : []),
        process.env.HEMMELIG_TRUSTED_ORIGIN || '',
    ].filter(Boolean),
    general: {
        instanceName: process.env.HEMMELIG_INSTANCE_NAME,
        instanceDescription: process.env.HEMMELIG_INSTANCE_DESCRIPTION,
        instanceLogo: process.env.HEMMELIG_INSTANCE_LOGO,
        allowRegistration: parseBoolean(process.env.HEMMELIG_ALLOW_REGISTRATION),
    },
    security: {
        allowPasswordProtection: parseBoolean(process.env.HEMMELIG_ALLOW_PASSWORD_PROTECTION),
        allowIpRestriction: parseBoolean(process.env.HEMMELIG_ALLOW_IP_RESTRICTION),
    },
    analytics: {
        enabled: parseBoolean(process.env.HEMMELIG_ANALYTICS_ENABLED) ?? true,
        // Fall back to another instance secret, then to a random per-process
        // value. Never use a public constant, which would make visitor IDs
        // predictable.
        hmacSecret:
            process.env.HEMMELIG_ANALYTICS_HMAC_SECRET ||
            process.env.BETTER_AUTH_SECRET ||
            randomBytes(32).toString('hex'),
    },
    socialProviders,
};

if (!process.env.HEMMELIG_ANALYTICS_HMAC_SECRET && config.analytics.enabled) {
    console.warn(
        'WARNING: HEMMELIG_ANALYTICS_HMAC_SECRET is not set. Visitor IDs use another ' +
            'instance secret, or a random value that changes on every restart. Set ' +
            'HEMMELIG_ANALYTICS_HMAC_SECRET to keep visitor IDs stable.'
    );
}

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

// Outside managed mode, these variables override the database value when they
// are set. The admin settings API reports them so that the UI can lock the rows.
const ENVIRONMENT_OVERRIDE_VARIABLES = {
    instanceName: 'HEMMELIG_INSTANCE_NAME',
    instanceDescription: 'HEMMELIG_INSTANCE_DESCRIPTION',
    instanceLogo: 'HEMMELIG_INSTANCE_LOGO',
    allowRegistration: 'HEMMELIG_ALLOW_REGISTRATION',
    allowPasswordProtection: 'HEMMELIG_ALLOW_PASSWORD_PROTECTION',
    allowIpRestriction: 'HEMMELIG_ALLOW_IP_RESTRICTION',
} as const;

export interface EnvironmentOverrides {
    /** The setting values that environment variables set. */
    values: Record<string, unknown>;
    /** The environment variable name for each overridden setting. */
    variables: Record<string, string>;
}

/**
 * Returns the settings that environment variables override outside managed mode.
 * In managed mode, all settings come from the environment, so the result is empty.
 */
function getEnvironmentOverrides(): EnvironmentOverrides {
    const overrides: EnvironmentOverrides = { values: {}, variables: {} };

    if (isManaged) {
        return overrides;
    }

    const source: Record<string, unknown> = { ...config.general, ...config.security };

    for (const [key, variable] of Object.entries(ENVIRONMENT_OVERRIDE_VARIABLES)) {
        if (source[key] !== undefined) {
            overrides.values[key] = source[key];
            overrides.variables[key] = variable;
        }
    }

    return overrides;
}

// Export the get function and social providers helper
export default {
    get,
    getSocialProviders: () => config.socialProviders,
    getGenericOAuthProviders: () => genericOAuthProviders,
    getHidePasswordLogin: () => hidePasswordLogin,
    isManaged: () => isManaged,
    getManagedSettings: () => managedSettings,
    getEnvironmentOverrides,
};
