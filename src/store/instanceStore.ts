import { toast } from 'sonner';
import { create } from 'zustand';
import { api } from '../lib/api';

type GeneralSettings = {
    instanceName: string;
    instanceDescription: string;
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    maxSecretsPerUser: number;
    defaultSecretExpiration: number;
    maxSecretSize: number;
};

type SecuritySettings = {
    enforceHttps: boolean;
    allowPasswordProtection: boolean;
    allowIpRestriction: boolean;
    maxPasswordAttempts: number;
    sessionTimeout: number;
    enableRateLimiting: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
};

type OrganizationSettings = {
    requireInviteCode: boolean;
    allowedEmailDomains: string;
    requireRegisteredUser: boolean;
};

type InstanceState = {
    generalSettings: GeneralSettings;
    securitySettings: SecuritySettings;
    organizationSettings: OrganizationSettings;
    isLoading: boolean;
    error: string | null;
    fetchSettings: () => Promise<void>;
    setGeneralSetting: <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => void;
    setSecuritySetting: <K extends keyof SecuritySettings>(
        key: K,
        value: SecuritySettings[K]
    ) => void;
    setOrganizationSetting: <K extends keyof OrganizationSettings>(
        key: K,
        value: OrganizationSettings[K]
    ) => void;
    saveSettings: (section: 'general' | 'security' | 'organization') => Promise<void>;
};

export const useInstanceStore = create<InstanceState>((set, get) => ({
    generalSettings: {
        instanceName: '',
        instanceDescription: '',
        allowRegistration: true,
        requireEmailVerification: false,
        maxSecretsPerUser: 1000,
        defaultSecretExpiration: 72,
        maxSecretSize: 1024,
    },
    securitySettings: {
        enforceHttps: true,
        allowPasswordProtection: true,
        allowIpRestriction: true,
        maxPasswordAttempts: 3,
        sessionTimeout: 24,
        enableRateLimiting: true,
        rateLimitRequests: 100,
        rateLimitWindow: 60,
    },
    organizationSettings: {
        requireInviteCode: false,
        allowedEmailDomains: '',
        requireRegisteredUser: false,
    },
    isLoading: false,
    error: null,

    fetchSettings: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.instance.settings.$get();
            if (res.status === 403) {
                const errorMsg = "You don't have permission to view settings.";
                toast.error(errorMsg);
                set({ error: errorMsg, isLoading: false });
                return;
            }
            const settings = await res.json();
            set({
                generalSettings: {
                    instanceName: settings.instanceName,
                    instanceDescription: settings.instanceDescription,
                    allowRegistration: settings.allowRegistration,
                    requireEmailVerification: settings.requireEmailVerification,
                    maxSecretsPerUser: settings.maxSecretsPerUser,
                    defaultSecretExpiration: settings.defaultSecretExpiration,
                    maxSecretSize: settings.maxSecretSize,
                },
                securitySettings: {
                    enforceHttps: settings.enforceHttps,
                    allowPasswordProtection: settings.allowPasswordProtection,
                    allowIpRestriction: settings.allowIpRestriction,
                    maxPasswordAttempts: settings.maxPasswordAttempts,
                    sessionTimeout: settings.sessionTimeout,
                    enableRateLimiting: settings.enableRateLimiting,
                    rateLimitRequests: settings.rateLimitRequests,
                    rateLimitWindow: settings.rateLimitWindow,
                },
                organizationSettings: {
                    requireInviteCode: settings.requireInviteCode ?? false,
                    allowedEmailDomains: settings.allowedEmailDomains ?? '',
                    requireRegisteredUser: settings.requireRegisteredUser ?? false,
                },
                isLoading: false,
            });
        } catch (error) {
            const errorMsg = 'Failed to fetch settings.';
            console.error(errorMsg, error);
            toast.error(errorMsg);
            set({ error: errorMsg, isLoading: false });
        }
    },

    setGeneralSetting: (key, value) => {
        set((state) => ({
            generalSettings: { ...state.generalSettings, [key]: value },
        }));
    },

    setSecuritySetting: (key, value) => {
        set((state) => ({
            securitySettings: { ...state.securitySettings, [key]: value },
        }));
    },

    setOrganizationSetting: (key, value) => {
        set((state) => ({
            organizationSettings: { ...state.organizationSettings, [key]: value },
        }));
    },

    saveSettings: async (section) => {
        set({ isLoading: true });
        try {
            const { generalSettings, securitySettings, organizationSettings } = get();
            let settingsToSave = {};
            if (section === 'general') {
                settingsToSave = generalSettings;
            } else if (section === 'security') {
                settingsToSave = securitySettings;
            } else if (section === 'organization') {
                settingsToSave = organizationSettings;
            }

            await api.instance.settings.$put({ json: settingsToSave });
            toast.success(
                `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully.`
            );
        } catch (error) {
            console.error(`Failed to save ${section} settings:`, error);
            toast.error(`Failed to save ${section} settings.`);
        } finally {
            set({ isLoading: false });
        }
    },
}));
