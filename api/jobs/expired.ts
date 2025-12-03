import { unlink } from 'fs/promises';
import prisma from '../lib/db';

export const deleteExpiredSecrets = async () => {
    try {
        const now = new Date();
        await prisma.secrets.deleteMany({
            where: {
                expiresAt: {
                    lte: now,
                },
            },
        });
    } catch (error) {
        console.error('Error deleting expired secrets:', error);
    }
};

export const deleteOrphanedFiles = async () => {
    try {
        // Find files that are not associated with any secret
        const orphanedFiles = await prisma.file.findMany({
            where: {
                secrets: {
                    none: {},
                },
            },
        });

        if (orphanedFiles.length === 0) {
            return;
        }

        // Delete files from disk
        for (const file of orphanedFiles) {
            try {
                await unlink(file.path);
            } catch (error) {
                // File may already be deleted or inaccessible
                console.error(`Failed to delete file from disk: ${file.path}`, error);
            }
        }

        // Delete orphaned file records from database
        await prisma.file.deleteMany({
            where: {
                id: {
                    in: orphanedFiles.map((f) => f.id),
                },
            },
        });
    } catch (error) {
        console.error('Error deleting orphaned files:', error);
    }
};
