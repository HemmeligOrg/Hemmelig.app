import { z } from 'zod';
import { usernameSchema } from './shared';

const roleSchema = z.enum(['user', 'admin']);

export const updateUserSchema = z.object({
    username: usernameSchema.optional(),
    email: z.string().email().optional(),
    role: roleSchema.optional(),
});

export const createUserSchema = z.object({
    username: usernameSchema,
    email: z.string().email().max(254),
    // The password policy runs in the route, so the error names the failed rule.
    password: z.string().min(1).max(128),
    name: z.string().trim().min(1).max(100).optional(),
    role: roleSchema.optional(),
});

export const banUserSchema = z.object({
    reason: z.string().trim().max(500).optional(),
    expiresInSeconds: z
        .number()
        .int()
        .min(60)
        .max(10 * 365 * 24 * 60 * 60)
        .optional(),
});

export const setUserPasswordSchema = z.object({
    password: z.string().min(1).max(128),
});
