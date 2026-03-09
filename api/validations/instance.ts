import { z } from 'zod';
import { sanitizeString } from './shared';

const sanitizedString = (maxLength: number) =>
    z.string().transform(sanitizeString).pipe(z.string().max(maxLength));

// Max logo size: 512KB in base64 (which is ~683KB as base64 string)
const MAX_LOGO_BASE64_LENGTH = 700000;

export const instanceSettingsSchema = z.object({
    instanceName: sanitizedString(100).optional(),
    instanceDescription: sanitizedString(500).optional(),
    instanceLogo: z
        .string()
        .max(MAX_LOGO_BASE64_LENGTH, 'Logo must be smaller than 512KB')
        .refine(
            (val) => {
                if (!val || val === '') return true;
                // Check if it's a valid base64 data URL for images
                return /^data:image\/(png|jpeg|jpg|gif|svg\+xml|webp);base64,/.test(val);
            },
            { message: 'Logo must be a valid image (PNG, JPEG, GIF, SVG, or WebP)' }
        )
        .optional(),
    allowRegistration: z.boolean().optional(),
    requireEmailVerification: z.boolean().optional(),
    maxSecretsPerUser: z.number().int().min(1).optional(),
    defaultSecretExpiration: z.number().int().min(1).optional(),
    maxSecretSize: z.number().int().min(1).optional(),

    allowPasswordProtection: z.boolean().optional(),
    allowIpRestriction: z.boolean().optional(),
    allowFileUploads: z.boolean().optional(),
    maxPasswordAttempts: z.number().int().min(1).optional(),
    sessionTimeout: z.number().int().min(1).optional(),
    enableRateLimiting: z.boolean().optional(),
    rateLimitRequests: z.number().int().min(1).optional(),
    rateLimitWindow: z.number().int().min(1).optional(),

    // Organization features
    requireInviteCode: z.boolean().optional(),
    allowedEmailDomains: sanitizedString(500).optional(),
    requireRegisteredUser: z.boolean().optional(),
    disableEmailPasswordSignup: z.boolean().optional(),

    // Webhook notifications
    webhookEnabled: z.boolean().optional(),
    webhookUrl: z.string().url().optional().or(z.literal('')),
    webhookSecret: sanitizedString(200).optional(),
    webhookOnView: z.boolean().optional(),
    webhookOnBurn: z.boolean().optional(),

    // Important message alert
    importantMessage: sanitizedString(1000).optional(),

    // Prometheus metrics
    metricsEnabled: z.boolean().optional(),
    metricsSecret: sanitizedString(200).optional(),
});
