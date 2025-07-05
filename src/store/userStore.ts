import { create } from 'zustand';
import { createAuthClient } from 'better-auth/react';

const auth = createAuthClient();

interface User {
    id: string;
    username: string;
    email: string;
    isAdmin: boolean;
}

export const useUserStore = create<{
    user: User | null;
    isLoading: boolean;
    error: Error | null;
    fetchUser: () => Promise<void>;
}>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  fetchUser: async () => {
    set({ isLoading: true, error: null });
    const { data, error } = await auth.getSession();
    set({ user: data?.user as User, isLoading: false, error: error as Error | null });
  },
}));
