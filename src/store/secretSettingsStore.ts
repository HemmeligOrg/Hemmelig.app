import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Default secret expiration: 12 hours in seconds */
const DEFAULT_EXPIRATION_SECONDS = 43200;

interface SecretSettings {
    expiresAt: number;
    views: number;
    isBurnable: boolean;
}

interface SecretSettingsState {
    saveSettings: boolean;
    settings: SecretSettings;
    setSaveSettings: (save: boolean) => void;
    updateSettings: (settings: Partial<SecretSettings>) => void;
}

const defaultSettings: SecretSettings = {
    expiresAt: DEFAULT_EXPIRATION_SECONDS,
    views: 1,
    isBurnable: false,
};

// Store a callback to apply settings - will be set by secretStore
let applySettingsCallback: ((settings: SecretSettings) => void) | null = null;

export const setApplySettingsCallback = (callback: (settings: SecretSettings) => void) => {
    applySettingsCallback = callback;

    // If already hydrated and saveSettings is true, apply immediately
    const state = useSecretSettingsStore.getState();
    if (state.saveSettings) {
        callback(state.settings);
    }
};

export const useSecretSettingsStore = create<SecretSettingsState>()(
    persist(
        (set) => ({
            saveSettings: false,
            settings: defaultSettings,
            setSaveSettings: (save: boolean) => set({ saveSettings: save }),
            updateSettings: (newSettings: Partial<SecretSettings>) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                })),
        }),
        {
            name: 'hemmelig-secret-settings',
            onRehydrateStorage: () => (state) => {
                // Apply saved settings after hydration
                if (state?.saveSettings && applySettingsCallback) {
                    applySettingsCallback(state.settings);
                }
            },
        }
    )
);
