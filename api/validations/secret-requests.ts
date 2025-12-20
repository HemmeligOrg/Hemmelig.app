import isCidr from 'is-cidr';
import { isIP } from 'is-ip';
import { z } from 'zod';
import { EXPIRATION_TIMES_SECONDS } from '../lib/constants';
import { isPublicUrl } from '../lib/utils';

// Valid durations for request validity (how long the creator link is active)
export const REQUEST_VALIDITY_SECONDS = [
    2592000, // 30 days
    1209600, // 14 days
    604800, // 7 days
    259200, // 3 days
    86400, // 1 day
    43200, // 12 hours
    3600, // 1 hour
] as const;

export const createSecretRequestSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    maxViews: z.number().int().min(1).max(9999).default(1),
    expiresIn: z
        .number()
        .refine(
            (val) =>
                EXPIRATION_TIMES_SECONDS.includes(val as (typeof EXPIRATION_TIMES_SECONDS)[number]),
            {
                message: 'Invalid expiration time for secret',
            }
        ),
    validFor: z
        .number()
        .refine(
            (val) =>
                REQUEST_VALIDITY_SECONDS.includes(val as (typeof REQUEST_VALIDITY_SECONDS)[number]),
            {
                message: 'Invalid validity period for request',
            }
        ),

    allowedIp: z
        .string()
        .refine((val) => isCidr(val) || isIP(val), {
            message: 'Must be a valid IPv4, IPv6, or CIDR',
        })
        .nullable()
        .optional(),
    preventBurn: z.boolean().default(false),
    webhookUrl: z
        .string()
        .url()
        .refine((url) => isPublicUrl(url), {
            message: 'Webhook URL cannot point to private/internal addresses',
        })
        .optional(),
});

export const secretRequestIdParamSchema = z.object({
    id: z.string().uuid(),
});

export const secretRequestTokenQuerySchema = z.object({
    token: z.string().length(64),
});

// Max encrypted secret size: 1MB (1,048,576 bytes)
const MAX_SECRET_SIZE = 1024 * 1024;
// Min encrypted secret size: 28 bytes (12 IV + 16 minimum ciphertext with auth tag)
const MIN_SECRET_SIZE = 28;
// Max encrypted title size: 1KB (1,024 bytes)
const MAX_TITLE_SIZE = 1024;

export const submitSecretRequestSchema = z.object({
    secret: z
        .preprocess((arg) => {
            if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
                const values = Object.values(arg);
                return new Uint8Array(values as number[]);
            }
            return arg;
        }, z.instanceof(Uint8Array))
        .refine((arr) => arr.length >= MIN_SECRET_SIZE, {
            message: 'Secret data is too small to be valid encrypted content',
        })
        .refine((arr) => arr.length <= MAX_SECRET_SIZE, {
            message: `Secret exceeds maximum size of ${MAX_SECRET_SIZE} bytes`,
        }),
    title: z
        .preprocess((arg) => {
            if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
                const values = Object.values(arg);
                return new Uint8Array(values as number[]);
            }
            return arg;
        }, z.instanceof(Uint8Array))
        .refine((arr) => arr.length <= MAX_TITLE_SIZE, {
            message: `Title exceeds maximum size of ${MAX_TITLE_SIZE} bytes`,
        })
        .optional()
        .nullable(),
    salt: z.string().min(16).max(64),
});

export const secretRequestsQuerySchema = z.object({
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
    status: z.enum(['all', 'pending', 'fulfilled', 'expired', 'cancelled']).optional(),
});

export const processSecretRequestsQueryParams = (
    query: z.infer<typeof secretRequestsQuerySchema>
) => {
    const page = query.page ? parseInt(query.page, 10) : undefined;
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;
    const take = limit && limit > 0 && limit <= 100 ? limit : 10;
    const skip = page && page > 0 ? (page - 1) * take : 0;

    return { skip, take, status: query.status };
};
