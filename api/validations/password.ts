import { z } from 'zod';

/**
 * Shared password strength rules.
 * Used by Zod schemas and the better-auth sign-up hook.
 */
export const PASSWORD_RULES = {
    minLength: 8,
    patterns: [
        { regex: /[a-z]/, message: 'Password must contain at least one lowercase letter' },
        { regex: /[A-Z]/, message: 'Password must contain at least one uppercase letter' },
        { regex: /[0-9]/, message: 'Password must contain at least one number' },
    ],
} as const;

/**
 * Validates a password against strength rules.
 * Returns the first error message found, or null if valid.
 */
export function validatePassword(password: string): string | null {
    if (password.length < PASSWORD_RULES.minLength) {
        return `Password must be at least ${PASSWORD_RULES.minLength} characters`;
    }

    for (const { regex, message } of PASSWORD_RULES.patterns) {
        if (!regex.test(password)) {
            return message;
        }
    }

    return null;
}

/**
 * Zod schema for validating new password strength.
 */
export const passwordSchema = z
    .string()
    .min(
        PASSWORD_RULES.minLength,
        `Password must be at least ${PASSWORD_RULES.minLength} characters`
    )
    .regex(PASSWORD_RULES.patterns[0].regex, PASSWORD_RULES.patterns[0].message)
    .regex(PASSWORD_RULES.patterns[1].regex, PASSWORD_RULES.patterns[1].message)
    .regex(PASSWORD_RULES.patterns[2].regex, PASSWORD_RULES.patterns[2].message);
