import { z } from 'zod';
import isCidr from 'is-cidr';

// Schema for URL parameters (expecting string from URL)
export const secretsIdParamSchema = z.object({
    id: z.string(),
});

// Schema for query parameters (expecting strings from URL)
export const secretsQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .refine(val => val === undefined || /^\d+$/.test(val), {
            message: 'Page must be a positive integer string',
        }),
    limit: z
        .string()
        .optional()
        .refine(val => val === undefined || /^\d+$/.test(val), {
            message: 'Limit must be a positive integer string',
        }),
    name: z.string().optional(),
    description: z.string().optional(),
});

// Schema for secrets search query parameters
export const secretsSearchQuerySchema = z.object({
    query: z
        .string({
            required_error: 'Search query is required',
            invalid_type_error: 'Search query must be a string',
        })
        .min(1, { message: 'Search query cannot be empty' }),
    page: z
        .string()
        .optional()
        .refine(val => val === undefined || /^\d+$/.test(val), {
            message: 'Page must be a positive integer string',
        }),
    limit: z
        .string()
        .optional()
        .refine(val => val === undefined || /^\d+$/.test(val), {
            message: 'Limit must be a positive integer string',
        }),
});

const secretSchema = {
    secret: z
        .string()
        .min(1, { message: 'Secret is required and cannot be empty' }),
    title: z.string().nullable(),
    password: z.string().nullable(),
    expiresAt: z.coerce.date().nullable(),
    views: z.number().int().min(1).max(9999).optional(),
    isBurnable: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    ipRange: z.string()
        .refine(
            (val) => isCidr(val),
            { message: 'Must be a valid IPv4, IPv6, or CIDR' }
        )
        .optional(),
};

export const createSecretsSchema = z.object(secretSchema);

export const updateSecretsSchema = z.object(secretSchema);

const internalQueryParamsSchema = z.object({
    skip: z.number().int().min(0).optional(),
    take: z.number().int().min(1).max(100).optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    name: z.string().optional(),
    description: z.string().optional(),
});

interface ProcessedSecretsQueryParams {
    where: Record<string, any>; // Using Record<string, any> for the dynamic where clause
    skip: number;
    take: number;
}

export const processSecretsQueryParams = (
    query: z.infer<typeof secretsQuerySchema>,
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
        name: query.name,
        description: query.description,
    });

    if (!parseResult.success) {
        // Log error but return defaults for pagination, potentially empty where clause
        console.error(
            'secrets query parameter processing error:',
            parseResult.error,
        );
        return { where: {}, skip: 0, take: 10 };
    }

    // Use validated name/description for the where clause
    const { name, description } = parseResult.data;
    const where: Record<string, any> = {}; // Match interface type
    if (name) {
        where.name = { contains: name, mode: 'insensitive' };
    }
    if (description) {
        where.description = { contains: description, mode: 'insensitive' };
    }

    // Return the determined where clause and the guaranteed numeric skip/take values
    return { where, skip, take };
};
