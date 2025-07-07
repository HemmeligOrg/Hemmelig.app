import dlv from 'dlv';

const isProduction = process.env.NODE_ENV === 'production';

const config = {
    server: {
        port: Number(process.env.PORT) || 3000,
    },
    file: {
        maxSize: (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024, // Default 10MB
    },
    trustedOrigins: [
        "https://hemmelig.app",
        ...(!isProduction ? ["http://localhost:5173"] : []),
        process.env.TRUSTED_ORIGIN || "",
    ].filter(Boolean), // Filter out any empty strings
} as const;

/**
 * A type-safe utility to get a value from the configuration.
 * Its return type is inferred from the type of the default value.
 * @param path The dot-notation path to the config value (e.g., 'server.port').
 * @param defaultValue A default value to return if the path is not found.
 * @returns The found configuration value or the default value.
 */
function get<T>(path: string, defaultValue?: T): T {
    // `delve` returns `any`, so we cast its result to the expected generic type `T`.
    return dlv(config, path, defaultValue) as T;
}

// Export the get function.
export default {
    get,
};

// -------------------------------------------------------------------
// EXAMPLE USAGE (how you would use this in other parts of your app)
// -------------------------------------------------------------------
// 
// Fallback to 8080 if 'server.port' is not defined in the config.
// const port = get('server.port', 8080);

