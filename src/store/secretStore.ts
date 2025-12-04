import { create } from 'zustand';
import { setApplySettingsCallback, useSecretSettingsStore } from './secretSettingsStore';

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
    setSecretIdAndKeys: (
        secretId: string | null,
        decryptionKey: string | null,
        password: string | null
    ) => void;
    setSecretData: (
        data: Partial<
            Pick<SecretState, 'secret' | 'title' | 'expiresAt' | 'views' | 'isBurnable' | 'ipRange'>
        >
    ) => void;
    resetSecret: () => void;
}

const defaultState = {
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
    ...defaultState,
    setSecretIdAndKeys: (secretId, decryptionKey, password) =>
        set({ secretId, decryptionKey, password }),
    setSecretData: (data) => set((state) => ({ ...state, ...data })),
    resetSecret: () => {
        const settingsStore = useSecretSettingsStore.getState();
        if (settingsStore.saveSettings) {
            set({
                ...defaultState,
                expiresAt: settingsStore.settings.expiresAt,
                views: settingsStore.settings.views,
                isBurnable: settingsStore.settings.isBurnable,
            });
        } else {
            set(defaultState);
        }
    },
}));

// Register callback to apply saved settings on hydration
setApplySettingsCallback((settings) => {
    useSecretStore.getState().setSecretData({
        expiresAt: settings.expiresAt,
        views: settings.views,
        isBurnable: settings.isBurnable,
    });
});
