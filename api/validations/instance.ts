import { z } from 'zod';

export const instanceSettingsSchema = z.object({
    instanceName: z.string().optional(),
    instanceDescription: z.string().optional(),
    allowRegistration: z.boolean().optional(),
    requireEmailVerification: z.boolean().optional(),
    maxSecretsPerUser: z.number().int().min(1).optional(),
    defaultSecretExpiration: z.number().int().min(1).optional(),
    maxSecretSize: z.number().int().min(1).optional(),

    allowPasswordProtection: z.boolean().optional(),
    allowIpRestriction: z.boolean().optional(),
    maxPasswordAttempts: z.number().int().min(1).optional(),
    sessionTimeout: z.number().int().min(1).optional(),
    enableRateLimiting: z.boolean().optional(),
    rateLimitRequests: z.number().int().min(1).optional(),
    rateLimitWindow: z.number().int().min(1).optional(),

    // Organization features
    requireInviteCode: z.boolean().optional(),
    allowedEmailDomains: z.string().optional(),
    requireRegisteredUser: z.boolean().optional(),

    // Webhook notifications
    webhookEnabled: z.boolean().optional(),
    webhookUrl: z.string().url().optional().or(z.literal('')),
    webhookSecret: z.string().optional(),
    webhookOnView: z.boolean().optional(),
    webhookOnBurn: z.boolean().optional(),
});
