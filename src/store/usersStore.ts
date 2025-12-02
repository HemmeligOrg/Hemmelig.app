import { createAuthClient } from 'better-auth/client';
import { adminClient } from 'better-auth/client/plugins';
import { toast } from 'sonner';
import { create } from 'zustand';
import { api } from '../lib/api';

const auth = createAuthClient({
    plugins: [adminClient()],
});

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
    approved: boolean;
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
    users: User[];
    userToDelete: User | null;
    userToEdit: User | null;
    isAddUserModalOpen: boolean;
    searchTerm: string;
    error: string | null;
    fetchUsers: () => Promise<void>;
    addUser: (newUser: NewUser) => Promise<void>;
    editUser: (user: User & { password?: string }) => Promise<void>;
    deleteUser: () => Promise<void>;
    approveUser: (userId: string) => Promise<void>;
    rejectUser: (userId: string) => Promise<void>;
    setUserToDelete: (user: User | null) => void;
    setUserToEdit: (user: User | null) => void;
    setIsAddUserModalOpen: (isOpen: boolean) => void;
    setSearchTerm: (term: string) => void;
}

export const useUsersStore = create<UsersStore>((set, get) => ({
    users: [],
    userToDelete: null,
    userToEdit: null,
    isAddUserModalOpen: false,
    searchTerm: '',
    error: null,
    fetchUsers: async () => {
        set({ error: null });
        try {
            const response = await auth.admin.listUsers();
            if (response.status === 403) {
                const errorMsg = "You don't have permission to view users.";
                toast.error(errorMsg);
                set({ error: errorMsg, users: [] });
                return;
            }
            set({ users: response?.data?.users || [] });
        } catch (error) {
            const errorMsg = 'Failed to fetch users';
            console.error(errorMsg, error);
            toast.error(errorMsg);
            set({ users: [], error: errorMsg });
        }
    },
    addUser: async (newUser) => {
        try {
            await auth.admin.createUser({
                name: newUser.name,
                email: newUser.email,
                password: newUser.password,
                role: newUser.role,
                data: {
                    username: newUser.username,
                    displayUsername: newUser.username,
                },
            });
            await get().fetchUsers();
            set({ isAddUserModalOpen: false });
        } catch (error) {
            console.error('Failed to create user', error);
        }
    },
    editUser: async (user) => {
        try {
            await api.user[':id'].$put({
                param: { id: user.id },
                json: { username: user.username, email: user.email },
            });
            await auth.admin.setRole({ userId: user.id, role: user.role });
            if (user.banned) {
                await auth.admin.banUser({ userId: user.id });
            } else {
                await auth.admin.unbanUser({ userId: user.id });
            }
            await get().fetchUsers();
            set({ userToEdit: null });
        } catch (error) {
            console.error('Failed to update user', error);
        }
    },
    deleteUser: async () => {
        const { userToDelete } = get();
        if (!userToDelete) return;
        try {
            await auth.admin.removeUser({ userId: userToDelete.id });
            await get().fetchUsers();
            set({ userToDelete: null });
        } catch (error) {
            console.error('Failed to delete user', error);
        }
    },
    approveUser: async (userId: string) => {
        try {
            await api.user[':id'].approve.$post({
                param: { id: userId },
            });
            toast.success('User approved');
            await get().fetchUsers();
        } catch (error) {
            console.error('Failed to approve user', error);
            toast.error('Failed to approve user');
        }
    },
    rejectUser: async (userId: string) => {
        try {
            await api.user[':id'].reject.$post({
                param: { id: userId },
                json: {},
            });
            toast.success('User rejected and removed');
            await get().fetchUsers();
        } catch (error) {
            console.error('Failed to reject user', error);
            toast.error('Failed to reject user');
        }
    },
    setUserToDelete: (user) => set({ userToDelete: user }),
    setUserToEdit: (user) => set({ userToEdit: user }),
    setIsAddUserModalOpen: (isOpen) => set({ isAddUserModalOpen: isOpen }),
    setSearchTerm: (term) => set({ searchTerm: term }),
}));
