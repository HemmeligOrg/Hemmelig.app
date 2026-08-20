import prisma from '../lib/db';
import { unlinkFiles } from '../lib/files';

export const deleteExpiredSecrets = async () => {
    try {
        const now = new Date();
        await prisma.secrets.deleteMany({
            where: {
                OR: [
                    {
                        expiresAt: {
                            lte: now,
                        },
                    },
                    {
                        views: 0,
                    },
                ],
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

        // Delete files from disk in parallel for better performance
        await unlinkFiles(orphanedFiles.map((file) => file.path));

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
