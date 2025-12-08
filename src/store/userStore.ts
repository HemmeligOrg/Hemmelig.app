import { create } from 'zustand';
import { authClient } from '../lib/auth';

interface User {
    id: string;
    username: string;
    email: string;
    isAdmin: boolean;
}

interface UserState {
    user: User | null;
    isLoading: boolean;
    error: Error | null;
    setUser: (user: User | null) => void;
    fetchUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    isLoading: false,
    error: null,
    setUser: (user) => set({ user, isLoading: false }),
    fetchUser: async () => {
        set({ isLoading: true, error: null });
        const { data, error } = await authClient.getSession();
        set({ user: data?.user as User | null, isLoading: false, error: error as Error | null });
    },
}));
