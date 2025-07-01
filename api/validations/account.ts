import { z } from 'zod';

export const updateAccountSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters long'),
    email: z.string().email('Invalid email address'),
});
