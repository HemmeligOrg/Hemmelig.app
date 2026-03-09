import { z } from 'zod';
import { EXPIRATION_TIMES_SECONDS } from '../lib/constants';
import {
    ipRangeSchema,
    paginationQuerySchema,
    processPaginationParams,
    uint8ArraySchema,
} from './shared';

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

    allowedIp: ipRangeSchema,
    preventBurn: z.boolean().default(false),
    webhookUrl: z.string().url().optional(),
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
    secret: uint8ArraySchema(MAX_SECRET_SIZE, `Secret (max ${MAX_SECRET_SIZE} bytes)`).refine(
        (arr) => arr instanceof Uint8Array && arr.length >= MIN_SECRET_SIZE,
        {
            message: 'Secret data is too small to be valid encrypted content',
        }
    ),
    title: uint8ArraySchema(MAX_TITLE_SIZE, `Title (max ${MAX_TITLE_SIZE} bytes)`)
        .optional()
        .nullable(),
    salt: z.string().min(16).max(64),
});

export const secretRequestsQuerySchema = paginationQuerySchema.extend({
    status: z.enum(['all', 'pending', 'fulfilled', 'expired', 'cancelled']).optional(),
});

export const processSecretRequestsQueryParams = (
    query: z.infer<typeof secretRequestsQuerySchema>
) => {
    const { skip, take } = processPaginationParams(query);
    return { skip, take, status: query.status };
};
