import prisma from '../lib/db';
import { DOWNLOAD_TOKEN_TTL_MS, removeStoredFile, UPLOAD_TOKEN_TTL_MS } from '../lib/files';

/**
 * Deletes the stored files and file records with the given ids, when no secret
 * uses them. A record stays when its file cannot be removed from disk, so that
 * a later run tries again.
 */
const deleteDetachedFiles = async (fileIds: string[]) => {
    if (fileIds.length === 0) {
        return;
    }

    const files = await prisma.file.findMany({
        where: { id: { in: fileIds }, secrets: { none: {} } },
        select: { id: true, path: true },
    });

    const removed: string[] = [];
    for (const file of files) {
        if (await removeStoredFile(file.path)) {
            removed.push(file.id);
        }
    }

    if (removed.length > 0) {
        await prisma.file.deleteMany({ where: { id: { in: removed } } });
    }
};

export const deleteExpiredSecrets = async () => {
    try {
        const now = new Date();
        const downloadGraceEnd = new Date(now.getTime() + DOWNLOAD_TOKEN_TTL_MS);

        // A reveal issues download tokens that last DOWNLOAD_TOKEN_TTL_MS. When
        // the last view of a secret with files is used, keep the secret until
        // those tokens expire, so that the recipient can still download the
        // files. The secret itself stays unreadable, because it has no views left.
        await prisma.secrets.updateMany({
            where: {
                views: { lte: 0 },
                files: { some: {} },
                expiresAt: { gt: downloadGraceEnd },
            },
            data: { expiresAt: downloadGraceEnd },
        });

        const expired = {
            OR: [
                { expiresAt: { lte: now } },
                // Secrets without files have nothing left to download.
                { views: { lte: 0 }, files: { none: {} } },
            ],
        };

        const secrets = await prisma.secrets.findMany({
            where: expired,
            select: { id: true, files: { select: { id: true } } },
        });

        if (secrets.length === 0) {
            return;
        }

        await prisma.secrets.deleteMany({
            where: { id: { in: secrets.map((secret) => secret.id) } },
        });

        // Remove the files of the deleted secrets now. deleteOrphanedFiles
        // keeps young unattached files, because they can be pending uploads.
        await deleteDetachedFiles(secrets.flatMap((secret) => secret.files.map((file) => file.id)));
    } catch (error) {
        console.error('Error deleting expired secrets:', error);
    }
};

export const deleteOrphanedFiles = async () => {
    try {
        // A client uploads files first and attaches them when it creates the
        // secret. Keep unattached files while their upload token is valid.
        const uploadGraceStart = new Date(Date.now() - UPLOAD_TOKEN_TTL_MS);

        const orphanedFiles = await prisma.file.findMany({
            where: {
                secrets: { none: {} },
                createdAt: { lt: uploadGraceStart },
            },
            select: { id: true },
        });

        await deleteDetachedFiles(orphanedFiles.map((file) => file.id));
    } catch (error) {
        console.error('Error deleting orphaned files:', error);
    }
};
