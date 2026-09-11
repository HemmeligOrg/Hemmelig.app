import prisma from './db';

const ROLLBACK_ATTEMPTS = 3;
const ROLLBACK_DELAYS_MS = [50, 100, 200];

/**
 * Checks whether an error is a Prisma error carrying the given error code.
 *
 * @param err - The thrown error to inspect.
 * @param code - The Prisma error code to match (e.g. 'P2002', 'P2025').
 * @returns True when the error is a Prisma error with the given code.
 */
export function prismaErrorHasCode(err: unknown, code: string): boolean {
    return (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: unknown }).code === code
    );
}

/**
 * Deletes a user record with bounded retries so transient SQLite lock errors do
 * not leave an orphaned user (e.g. a non-admin or uninvited account) behind.
 * A P2025 "record not found" is treated as success because the user is already
 * gone; only persistent failures return false and are logged as CRITICAL.
 *
 * @param userId - The ID of the user record to delete.
 * @returns True if the user no longer exists, false if every attempt failed.
 */
export async function deleteUserWithRetries(userId: string): Promise<boolean> {
    for (let attempt = 0; attempt < ROLLBACK_ATTEMPTS; attempt++) {
        try {
            await prisma.user.delete({ where: { id: userId } });
            return true;
        } catch (err) {
            if (prismaErrorHasCode(err, 'P2025')) {
                return true;
            }
            if (attempt === ROLLBACK_ATTEMPTS - 1) {
                console.error(
                    `CRITICAL: Failed to roll back user ${userId} after ${ROLLBACK_ATTEMPTS} attempts:`,
                    err
                );
                return false;
            }
            await new Promise((resolve) => setTimeout(resolve, ROLLBACK_DELAYS_MS[attempt]));
        }
    }
    return false;
}
