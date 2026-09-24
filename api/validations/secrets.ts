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

// The access verifier is a hex-encoded SHA-256 digest derived client-side.
const passwordVerifierSchema = z.string().regex(/^[a-f0-9]{64}$/, 'Invalid password verifier');

const secretSchema = {
    salt: z.string().min(1).max(64),
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
    // Deprecated. Raw passwords are rejected on creation so they never reach the server.
    password: z.string().max(1024).optional(),
    passwordVerifier: passwordVerifierSchema.optional(),
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
    // Deprecated. Signed file attachments replace this field.
    fileIds: z.array(z.string().min(1).max(64)).max(20).optional(),
    files: z
        .array(
            z.object({
                id: z
                    .string()
                    .min(1)
                    .max(64)
                    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID format'),
                token: z.string().min(1).max(256),
            })
        )
        .max(20)
        .optional(),
};

export const createSecretsSchema = z.object(secretSchema);

export const getSecretSchema = z.object({
    // Legacy path for secrets created before verifier-based access.
    password: z.string().max(1024).optional(),
    passwordVerifier: passwordVerifierSchema.optional(),
});

export const processSecretsQueryParams = (
    query: z.infer<typeof secretsQuerySchema>
): { skip: number; take: number } => {
    return processPaginationParams(query);
};
