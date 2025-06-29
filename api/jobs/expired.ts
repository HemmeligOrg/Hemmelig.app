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
