import { z } from 'zod';

export const updateAccountSchema = z.object({
    username: z.string().min(4, 'Username must be at least 3 characters long'),
    email: z.string().email('Invalid email address'),
});

export const updatePasswordSchema = z.object({
    currentPassword: z.string().min(5, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters long'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
