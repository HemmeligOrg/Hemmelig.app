import { APIError } from 'better-auth/api';
import { auth } from '../auth';
import { validatePassword } from '../validations/password';
import prisma from './db';

/** The user fields that the admin user routes return. */
export const adminUserSelect = {
    id: true,
    username: true,
    email: true,
    name: true,
    role: true,
    banned: true,
    banReason: true,
    banExpires: true,
    createdAt: true,
} as const;

/**
 * The Better Auth admin endpoint that creates users. The plugin list in
 * auth.ts is not typed, so this names the one method this module calls.
 */
interface AdminCreateUserApi {
    createUser(args: {
        body: {
            email: string;
            password: string;
            name: string;
            role: 'user' | 'admin';
            data: Record<string, string>;
        };
    }): Promise<{ user: { id: string } }>;
}

/** An error with the HTTP status that the route must return. */
export class AdminUserError extends Error {
    constructor(
        message: string,
        readonly status: 400 | 404 | 409
    ) {
        super(message);
        this.name = 'AdminUserError';
    }
}

const findUserOrFail = async (userId: string) => {
    const ctx = await auth.$context;
    const user = await ctx.internalAdapter.findUserById(userId);
    if (!user) {
        throw new AdminUserError('User not found', 404);
    }
    return ctx;
};

const assertPasswordPolicy = (password: string) => {
    const passwordError = validatePassword(password);
    if (passwordError) {
        throw new AdminUserError(passwordError, 400);
    }
};

interface CreateUserInput {
    username: string;
    email: string;
    password: string;
    name?: string;
    role?: 'user' | 'admin';
}

/**
 * Creates a user with a password, as the dashboard does. The Better Auth
 * endpoint hashes the password exactly like a sign-up, and the registration
 * policy does not apply to admin-created users.
 */
export const createUserAsAdmin = async (input: CreateUserInput) => {
    assertPasswordPolicy(input.password);

    const username = input.username.toLowerCase();
    const existing = await prisma.user.findFirst({
        where: { OR: [{ username }, { email: input.email.toLowerCase() }] },
        select: { id: true },
    });
    if (existing) {
        throw new AdminUserError('A user with this username or email already exists', 409);
    }

    try {
        const adminApi = auth.api as unknown as AdminCreateUserApi;
        const { user } = await adminApi.createUser({
            body: {
                email: input.email,
                password: input.password,
                name: input.name || username,
                role: input.role ?? 'user',
                data: { username, displayUsername: username },
            },
        });

        return prisma.user.findUniqueOrThrow({
            where: { id: user.id },
            select: adminUserSelect,
        });
    } catch (error) {
        if (error instanceof APIError) {
            throw new AdminUserError(error.message || 'Failed to create user', 400);
        }
        throw error;
    }
};

/**
 * Bans a user and ends all sessions of that user. API keys stop working at
 * once, because API key authentication checks the ban.
 */
export const banUserAsAdmin = async (
    userId: string,
    options: { reason?: string; expiresInSeconds?: number }
) => {
    const ctx = await findUserOrFail(userId);

    await ctx.internalAdapter.updateUser(userId, {
        banned: true,
        banReason: options.reason || 'No reason',
        banExpires: options.expiresInSeconds
            ? new Date(Date.now() + options.expiresInSeconds * 1000)
            : null,
        updatedAt: new Date(),
    });
    await ctx.internalAdapter.deleteUserSessions(userId);

    return prisma.user.findUniqueOrThrow({ where: { id: userId }, select: adminUserSelect });
};

/** Lifts the ban of a user. */
export const unbanUserAsAdmin = async (userId: string) => {
    const ctx = await findUserOrFail(userId);

    await ctx.internalAdapter.updateUser(userId, {
        banned: false,
        banReason: null,
        banExpires: null,
        updatedAt: new Date(),
    });

    return prisma.user.findUniqueOrThrow({ where: { id: userId }, select: adminUserSelect });
};

/**
 * Deletes a user the same way as the dashboard: sessions first, then the user.
 * The database removes accounts, API keys, 2FA records and secret requests of
 * the user. Secrets of the user stay until they expire, without an owner.
 */
export const deleteUserAsAdmin = async (userId: string) => {
    const ctx = await findUserOrFail(userId);

    await ctx.internalAdapter.deleteUserSessions(userId);
    await ctx.internalAdapter.deleteUser(userId);
};

/**
 * Sets the password of a user. Creates a password login when the user has
 * only social logins, as the dashboard does.
 */
export const setUserPasswordAsAdmin = async (userId: string, password: string) => {
    assertPasswordPolicy(password);
    const ctx = await findUserOrFail(userId);

    const hashedPassword = await ctx.password.hash(password);
    const accounts = await ctx.internalAdapter.findAccounts(userId);

    if (accounts.some((account) => account.providerId === 'credential')) {
        await ctx.internalAdapter.updatePassword(userId, hashedPassword);
    } else {
        await ctx.internalAdapter.createAccount({
            userId,
            providerId: 'credential',
            accountId: userId,
            password: hashedPassword,
        });
    }
};
