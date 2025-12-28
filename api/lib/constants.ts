/**
 * Time constants in milliseconds
 */
export const TIME = {
    /** One second in milliseconds */
    SECOND_MS: 1000,
    /** One minute in milliseconds */
    MINUTE_MS: 60 * 1000,
    /** One hour in milliseconds */
    HOUR_MS: 60 * 60 * 1000,
    /** One day in milliseconds */
    DAY_MS: 24 * 60 * 60 * 1000,
} as const;

/**
 * Secret-related constants
 */
export const SECRET = {
    /** Grace period for file downloads after last view (5 minutes) */
    FILE_DOWNLOAD_GRACE_PERIOD_MS: 5 * TIME.MINUTE_MS,
} as const;

/**
 * File upload constants
 */
export const FILE = {
    /** Default max file size in KB (10MB) */
    DEFAULT_MAX_SIZE_KB: 10240,
} as const;

/**
 * Valid secret expiration times in seconds
 */
export const EXPIRATION_TIMES_SECONDS = [
    2419200, // 28 days
    1209600, // 14 days
    604800, // 7 days
    259200, // 3 days
    86400, // 1 day
    43200, // 12 hours
    14400, // 4 hours
    3600, // 1 hour
    1800, // 30 minutes
    300, // 5 minutes
] as const;

/**
 * Instance settings fields - public (safe for all users)
 */
export const PUBLIC_SETTINGS_FIELDS = {
    instanceName: true,
    instanceDescription: true,
    instanceLogo: true,
    allowRegistration: true,
    defaultSecretExpiration: true,
    maxSecretSize: true,
    allowPasswordProtection: true,
    allowIpRestriction: true,
    allowFileUploads: true,
    requireRegisteredUser: true,
    importantMessage: true,
    disableEmailPasswordSignup: true,
} as const;

/**
 * Instance settings fields - admin only (all fields)
 */
export const ADMIN_SETTINGS_FIELDS = {
    ...PUBLIC_SETTINGS_FIELDS,
    requireEmailVerification: true,
    enableRateLimiting: true,
    rateLimitRequests: true,
    rateLimitWindow: true,
    requireInviteCode: true,
    allowedEmailDomains: true,
    disableEmailPasswordSignup: true,
    webhookEnabled: true,
    webhookUrl: true,
    webhookSecret: true,
    webhookOnView: true,
    webhookOnBurn: true,
    importantMessage: true,
    metricsEnabled: true,
    metricsSecret: true,
} as const;
