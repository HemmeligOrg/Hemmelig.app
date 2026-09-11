import prisma from './db';

/**
 * Atomically consumes an invite code use and associates the invite record ID with the specified user.
 *
 * @param invite - The invite record to consume, containing its id and optional maxUses limit.
 * @param userId - The ID of the user record to associate with the consumed invite.
 * @throws Error with message 'INVITE_EXHAUSTED' if the code reaches its usage limit concurrently.
 */
export async function consumeInviteCode(
    invite: { id: string; maxUses: number | null },
    userId: string
): Promise<void> {
    await prisma.$transaction(async (tx) => {
        const consumed = await tx.inviteCode.updateMany({
            where: {
                id: invite.id,
                isActive: true,
                uses: typeof invite.maxUses === 'number' ? { lt: invite.maxUses } : undefined,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            data: { uses: { increment: 1 } },
        });

        if (consumed.count === 0) {
            throw new Error('INVITE_EXHAUSTED');
        }

        await tx.user.update({
            where: { id: userId },
            data: { inviteCodeUsed: invite.id },
        });
    });
}
