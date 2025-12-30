import { z } from 'zod';

const sanitizeString = (str: string) => str.trim().replace(/[\x00-\x1F\x7F]/g, '');

const usernameSchema = z
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

export const updateUserSchema = z.object({
    username: usernameSchema.optional(),
    email: z.string().email().optional(),
});
