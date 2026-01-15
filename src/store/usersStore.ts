import { create } from 'zustand';
import { api } from '../lib/api';
import { authClient } from '../lib/auth';

interface User {
    id: string;
    name: string;
    username: string;
    displayUsername: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    role: string;
    banned: boolean;
    banReason: string | null;
    banExpires: string | null;
    createdAt: string;
    updatedAt: string;
}

interface NewUser {
    name: string;
    username: string;
    email: string;
    password: string;
    role: string;
}

interface UsersStore {
    userToDelete: User | null;
    userToEdit: User | null;
    isAddUserModalOpen: boolean;
    addUser: (newUser: NewUser) => Promise<void>;
    editUser: (user: User & { password?: string }) => Promise<void>;
    deleteUser: () => Promise<void>;
    setUserToDelete: (user: User | null) => void;
    setUserToEdit: (user: User | null) => void;
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
            role: newUser.role,
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
        await authClient.admin.setRole({ userId: user.id, role: user.role });
        if (user.banned) {
            await authClient.admin.banUser({ userId: user.id });
        } else {
            await authClient.admin.unbanUser({ userId: user.id });
        }
        set({ userToEdit: null });
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
