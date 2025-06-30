import { create } from 'zustand';

interface ErrorState {
    errors: string[];
    addError: (message: string) => void;
    clearErrors: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
    errors: [],
    addError: (message: string) => set((state) => ({ errors: [...state.errors, message] })),
    clearErrors: () => set({ errors: [] }),
}));
