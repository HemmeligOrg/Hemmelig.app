import { z } from 'zod';
import { usernameSchema } from './shared';

export const updateUserSchema = z.object({
    username: usernameSchema.optional(),
    email: z.string().email().optional(),
});
