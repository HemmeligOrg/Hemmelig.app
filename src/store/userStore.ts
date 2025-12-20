import { create } from 'zustand';
import { authClient } from '../lib/auth';

interface User {
    id: string;
    username: string;
    email: string;
    isAdmin: boolean;
}

// Session user from better-auth has role instead of isAdmin
interface SessionUser {
    id: string;
    username: string;
    email: string;
    role?: string;
}

// Map session user to our User interface
const mapSessionUser = (sessionUser: SessionUser | null): User | null => {
    if (!sessionUser) return null;
    return {
        id: sessionUser.id,
        username: sessionUser.username,
        email: sessionUser.email,
        isAdmin: sessionUser.role === 'admin',
    };
};

interface UserState {
    user: User | null;
    isLoading: boolean;
    error: Error | null;
    setUser: (user: SessionUser | null) => void;
    fetchUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    isLoading: false,
    error: null,
    setUser: (sessionUser) => set({ user: mapSessionUser(sessionUser), isLoading: false }),
    fetchUser: async () => {
        set({ isLoading: true, error: null });
        const { data, error } = await authClient.getSession();
        const sessionUser = data?.user as SessionUser | null;
        set({ user: mapSessionUser(sessionUser), isLoading: false, error: error as Error | null });
    },
}));
