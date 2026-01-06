import isCidr from 'is-cidr';
import { isIP } from 'is-ip';
import { z } from 'zod';
import { EXPIRATION_TIMES_SECONDS } from '../lib/constants';

// Schema for URL parameters (expecting string from URL)
export const secretsIdParamSchema = z.object({
    id: z.string(),
});

// Schema for query parameters (expecting strings from URL)
export const secretsQuerySchema = z.object({
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

const jsonToUint8ArraySchema = z.preprocess((arg) => {
    if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
        const values = Object.values(arg);

        return new Uint8Array(values);
    }

    return arg;
}, z.instanceof(Uint8Array));

const secretSchema = {
    salt: z.string(),
    secret: jsonToUint8ArraySchema,
    title: jsonToUint8ArraySchema.optional().nullable(),
    password: z.string().optional(),
    expiresAt: z
        .number()
        .refine(
            (val) =>
                EXPIRATION_TIMES_SECONDS.includes(val as (typeof EXPIRATION_TIMES_SECONDS)[number]),
            {
                message: 'Invalid expiration time',
            }
        ),
    views: z.number().int().min(1).max(9999).nullable().optional(),
    isBurnable: z.boolean().default(true).optional(),
    ipRange: z
        .string()
        .refine((val) => isCidr(val) || isIP(val), {
            message: 'Must be a valid IPv4, IPv6, or CIDR',
        })
        .nullable()
        .optional(),
    fileIds: z.array(z.string()).optional(),
};

export const createSecretsSchema = z.object(secretSchema);

export const getSecretSchema = z.object({
    password: z.string().optional(),
});

const internalQueryParamsSchema = z.object({
    skip: z.number().int().min(0).optional(),
    take: z.number().int().min(1).max(100).optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
});

interface ProcessedSecretsQueryParams {
    skip: number;
    take: number;
}

export const processSecretsQueryParams = (
    query: z.infer<typeof secretsQuerySchema>
): ProcessedSecretsQueryParams => {
    const page = query.page ? parseInt(query.page, 10) : undefined;
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;
    const take = limit && limit > 0 && limit <= 100 ? limit : 10; // Guaranteed number
    const skip = page && page > 0 ? (page - 1) * take : 0; // Guaranteed number

    // Optional: Validate other params if needed, but we already have skip/take
    const parseResult = internalQueryParamsSchema.safeParse({
        skip,
        take,
        page,
        limit,
    });

    if (!parseResult.success) {
        // Log error but return defaults for pagination
        console.error('secrets query parameter processing error:', parseResult.error);
        return { skip: 0, take: 10 };
    }

    return { skip, take };
};
