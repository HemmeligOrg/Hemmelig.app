import { create } from 'zustand';
import { api } from '../lib/api';
import { authClient } from '../lib/auth';

/** A user row as the admin user list returns it. */
export interface ManagedUser {
    id: string;
    username: string;
    email: string;
    role: string;
    banned: boolean;
    createdAt: string;
}

/** The fields that the edit dialog can change. */
export type UserUpdate = Pick<ManagedUser, 'id' | 'username' | 'email' | 'role' | 'banned'>;

/** Maps a role value from a form to a role that the auth client accepts. */
const toRole = (role: string): 'user' | 'admin' => (role === 'admin' ? 'admin' : 'user');

export interface NewUser {
    name: string;
    username: string;
    email: string;
    password: string;
    role: string;
}

interface UsersStore {
    userToDelete: ManagedUser | null;
    userToEdit: ManagedUser | null;
    isAddUserModalOpen: boolean;
    addUser: (newUser: NewUser) => Promise<void>;
    editUser: (user: UserUpdate) => Promise<void>;
    setBanned: (userId: string, banned: boolean) => Promise<void>;
    deleteUser: () => Promise<void>;
    setUserToDelete: (user: ManagedUser | null) => void;
    setUserToEdit: (user: ManagedUser | null) => void;
    setIsAddUserModalOpen: (isOpen: boolean) => void;
}

export const useUsersStore = create<UsersStore>((set, get) => ({
    userToDelete: null,
    userToEdit: null,
    isAddUserModalOpen: false,
    addUser: async (newUser) => {
        await authClient.admin.createUser({
            name: newUser.name,
            email: newUser.email,
            password: newUser.password,
            role: toRole(newUser.role),
            data: {
                username: newUser.username,
                displayUsername: newUser.username,
            },
        });
        set({ isAddUserModalOpen: false });
    },
    editUser: async (user) => {
        await api.user[':id'].$put({
            param: { id: user.id },
            json: { username: user.username, email: user.email },
        });
        await authClient.admin.setRole({ userId: user.id, role: toRole(user.role) });
        await get().setBanned(user.id, user.banned);
        set({ userToEdit: null });
    },
    setBanned: async (userId, banned) => {
        if (banned) {
            await authClient.admin.banUser({ userId });
        } else {
            await authClient.admin.unbanUser({ userId });
        }
    },
    deleteUser: async () => {
        const { userToDelete } = get();
        if (!userToDelete) return;
        await authClient.admin.removeUser({ userId: userToDelete.id });
        set({ userToDelete: null });
    },
    setUserToDelete: (user) => set({ userToDelete: user }),
    setUserToEdit: (user) => set({ userToEdit: user }),
    setIsAddUserModalOpen: (isOpen) => set({ isAddUserModalOpen: isOpen }),
}));
