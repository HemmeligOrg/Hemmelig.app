import { create } from 'zustand';

interface SecretState {
    secretId: string | null;
    decryptionKey: string | null;
    password: string | null;
    secret: string;
    title: string;
    expiresAt?: number;
    views: number;
    isBurnable: boolean;
    ipRange?: string | null;
    setSecretIdAndKeys: (secretId: string | null, decryptionKey: string | null, password: string | null) => void;
    setSecretData: (data: Partial<Omit<SecretState, 'secretId' | 'decryptionKey' | 'password' | 'setSecretIdAndKeys' | 'setSecretData' | 'resetSecret'>>) => void;
    resetSecret: () => void;
}

export const useSecretStore = create<SecretState>((set) => ({
    secretId: null,
    decryptionKey: null,
    password: null,
    secret: '',
    title: '',
    expiresAt: 14400, // Default to 4 hours
    views: 1,
    isBurnable: false,
    ipRange: undefined,
    setSecretIdAndKeys: (secretId, decryptionKey, password) => set({ secretId, decryptionKey, password }),
    setSecretData: (data) => set((state) => {
        return ({ ...state, ...data })
    }),
    resetSecret: () => set({
        secretId: null,
        decryptionKey: null,
        password: null,
        secret: '',
        title: '',
        expiresAt: 14400,
        views: 1,
        isBurnable: false,
        ipRange: undefined,
    }),
}));
