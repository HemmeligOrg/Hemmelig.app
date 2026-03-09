import { z } from 'zod';
import { passwordSchema } from './password';
import { usernameSchema } from './shared';

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
