import { create } from 'zustand';

interface SecretState {
    secretId: string | null;
    decryptionKey: string | null;
    password: string | null;
    secret: string;
    title: string;
    expiresAt: number;
    views: number;
    isBurnable: boolean;
    ipRange: string | null;
    setSecretIdAndKeys: (secretId: string | null, decryptionKey: string | null, password: string | null) => void;
    setSecretData: (data: Partial<Pick<SecretState, 'secret' | 'title' | 'expiresAt' | 'views' | 'isBurnable' | 'ipRange'>>) => void;
    resetSecret: () => void;
}

const initialState = {
    secretId: null,
    decryptionKey: null,
    password: null,
    secret: '',
    title: '',
    expiresAt: 43200,
    views: 1,
    isBurnable: false,
    ipRange: null,
};

export const useSecretStore = create<SecretState>((set) => ({
    ...initialState,
    setSecretIdAndKeys: (secretId, decryptionKey, password) => set({ secretId, decryptionKey, password }),
    setSecretData: (data) => set((state) => ({ ...state, ...data })),
    resetSecret: () => set(initialState),
}));
