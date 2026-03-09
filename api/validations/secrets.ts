import { z } from 'zod';
import { EXPIRATION_TIMES_SECONDS } from '../lib/constants';
import {
    idParamSchema,
    ipRangeSchema,
    paginationQuerySchema,
    processPaginationParams,
    uint8ArraySchema,
} from './shared';

// Hard ceiling for encrypted payloads at parse time (prevents memory exhaustion).
// Configurable via env var in KB, defaults to 1024 KB (1MB).
const MAX_ENCRYPTED_PAYLOAD_KB = parseInt(
    process.env.HEMMELIG_MAX_ENCRYPTED_PAYLOAD_SIZE || '1024',
    10
);
export const MAX_ENCRYPTED_SIZE = MAX_ENCRYPTED_PAYLOAD_KB * 1024;

// Re-export shared schemas for backwards compatibility
export const secretsIdParamSchema = idParamSchema;

export const secretsQuerySchema = paginationQuerySchema;

const secretSchema = {
    salt: z.string(),
    secret: uint8ArraySchema(
        MAX_ENCRYPTED_SIZE,
        `Encrypted payload (max ${MAX_ENCRYPTED_PAYLOAD_KB} KB)`
    ),
    title: uint8ArraySchema(
        MAX_ENCRYPTED_SIZE,
        `Encrypted title (max ${MAX_ENCRYPTED_PAYLOAD_KB} KB)`
    )
        .optional()
        .nullable(),
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
    views: z.number().int().min(1).max(9999).optional(),
    isBurnable: z.boolean().default(true).optional(),
    ipRange: ipRangeSchema,
    fileIds: z.array(z.string()).optional(),
};

export const createSecretsSchema = z.object(secretSchema);

export const getSecretSchema = z.object({
    password: z.string().optional(),
});

export const processSecretsQueryParams = (
    query: z.infer<typeof secretsQuerySchema>
): { skip: number; take: number } => {
    return processPaginationParams(query);
};
