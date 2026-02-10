import { z } from 'zod';
import { passwordSchema } from './password';

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

export const updateAccountSchema = z.object({
    username: usernameSchema,
    email: z.string().email('Invalid email address'),
});

export const updatePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: passwordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });
