import isCidr from 'is-cidr';
import { isIP } from 'is-ip';
import { z } from 'zod';

/**
 * Sanitizes a string by trimming whitespace and removing control characters.
 * Shared across all validation schemas that accept user-provided strings.
 */
export const sanitizeString = (str: string) => str.trim().replace(/[\x00-\x1F\x7F]/g, '');

/**
 * Username schema with sanitization and format validation.
 * Used for both account self-updates and admin user management.
 */
export const usernameSchema = z
    .string()
    .transform(sanitizeString)
    .pipe(
        z
            .string()
            .min(3, 'Username must be at least 3 characters')
            .max(50, 'Username must be at most 50 characters')
            .regex(
                /^[a-zA-Z0-9_-]+$/,
                'Username can only contain letters, numbers, underscores, and hyphens'
            )
    );

/**
 * Common ID parameter schema for route params.
 * Used across secrets, files, API keys, invites, etc.
 */
export const idParamSchema = z.object({
    id: z
        .string()
        .min(1)
        .max(64)
        .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID format'),
});

/**
 * IP address or CIDR range validation schema.
 * Used for secret IP restrictions and secret request allowed IPs.
 */
export const ipRangeSchema = z
    .string()
    .refine((val) => isCidr(val) || isIP(val), {
        message: 'Must be a valid IPv4, IPv6, or CIDR',
    })
    .nullable()
    .optional();

/**
 * Pagination query schema for string-based query parameters.
 * Validates that page and limit are numeric strings.
 */
export const paginationQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .refine((val) => val === undefined || /^\d+$/.test(val), {
            message: 'Page must be a positive integer string',
        }),
    limit: z
        .string()
        .optional()
        .refine((val) => val === undefined || /^\d+$/.test(val), {
            message: 'Limit must be a positive integer string',
        }),
});

/**
 * Processes raw pagination query params into skip/take values for Prisma.
 * Defaults: page=1, limit=10, max limit=100.
 */
export function processPaginationParams(query: { page?: string; limit?: string }): {
    skip: number;
    take: number;
} {
    const page = query.page ? parseInt(query.page, 10) : undefined;
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;
    const take = limit && limit > 0 && limit <= 100 ? limit : 10;
    const skip = page && page > 0 ? (page - 1) * take : 0;

    return { skip, take };
}

/**
 * Creates a Zod schema that preprocesses a JSON object representation of a Uint8Array
 * back into an actual Uint8Array, with an optional max size constraint.
 *
 * JSON serialization turns Uint8Array into { "0": 1, "1": 2, ... } objects,
 * so this handles the reverse transformation during validation.
 */
export function uint8ArraySchema(maxSize: number, label: string) {
    return z.preprocess(
        (arg) => {
            if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
                const values = Object.values(arg);
                if (values.length > maxSize) {
                    return arg; // Let the refine below catch the size error
                }
                return new Uint8Array(values as number[]);
            }
            return arg;
        },
        z.instanceof(Uint8Array).refine((arr) => arr.length <= maxSize, {
            message: `${label} exceeds maximum size of ${maxSize} bytes`,
        })
    );
}
