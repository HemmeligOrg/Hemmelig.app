import { create } from 'zustand';
import { useHemmeligStore } from './hemmeligStore';
import { setApplySettingsCallback, useSecretSettingsStore } from './secretSettingsStore';

/** Default secret expiration: 12 hours in seconds */
const DEFAULT_EXPIRATION_SECONDS = 43200;
/** Seconds per hour for conversion */
const SECONDS_PER_HOUR = 3600;

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

// Get default expiration from instance settings (in seconds), fallback to 12 hours
const getDefaultExpiration = () => {
    const instanceSettings = useHemmeligStore.getState().settings;
    // defaultSecretExpiration is in hours, convert to seconds
    return instanceSettings?.defaultSecretExpiration
        ? instanceSettings.defaultSecretExpiration * SECONDS_PER_HOUR
        : DEFAULT_EXPIRATION_SECONDS;
};

const defaultState = {
    secretId: null,
    decryptionKey: null,
    password: null,
    secret: '',
    title: '',
    expiresAt: DEFAULT_EXPIRATION_SECONDS,
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
        const defaultExpiration = getDefaultExpiration();
        if (settingsStore.saveSettings) {
            set({
                ...defaultState,
                expiresAt: settingsStore.settings.expiresAt,
                views: settingsStore.settings.views,
                isBurnable: settingsStore.settings.isBurnable,
            });
        } else {
            set({ ...defaultState, expiresAt: defaultExpiration });
        }
    },
}));

// Initialize expiration from instance settings when the hemmelig store is updated
useHemmeligStore.subscribe((state, prevState) => {
    if (
        state.settings?.defaultSecretExpiration !== prevState.settings?.defaultSecretExpiration &&
        state.settings?.defaultSecretExpiration
    ) {
        const secretStore = useSecretStore.getState();
        const settingsStore = useSecretSettingsStore.getState();
        // Only update if user hasn't modified the expiration (still at initial value)
        // and if saveSettings is not enabled (user preferences take precedence)
        if (!settingsStore.saveSettings && secretStore.expiresAt === DEFAULT_EXPIRATION_SECONDS) {
            useSecretStore.getState().setSecretData({
                expiresAt: state.settings.defaultSecretExpiration * SECONDS_PER_HOUR,
            });
        }
    }
});

// Register callback to apply saved settings on hydration
setApplySettingsCallback((settings) => {
    useSecretStore.getState().setSecretData({
        expiresAt: settings.expiresAt,
        views: settings.views,
        isBurnable: settings.isBurnable,
    });
});
