import { toast } from 'sonner';
import { create } from 'zustand';
import { api } from '../lib/api';

// Public settings available to all users
export type HemmeligSettings = {
    instanceName: string;
    instanceDescription: string;
    instanceLogo: string;
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    maxSecretsPerUser: number;
    defaultSecretExpiration: number;
    maxSecretSize: number;
    enforceHttps: boolean;
    allowPasswordProtection: boolean;
    allowIpRestriction: boolean;
    allowFileUploads: boolean;
    maxPasswordAttempts: number;
    sessionTimeout: number;
    enableRateLimiting: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
    requireInviteCode: boolean;
    requireRegisteredUser: boolean;
    disableEmailPasswordSignup: boolean;
    primaryColor: string;
    importantMessage: string;
};

// Admin-only settings types (for InstancePage)
type GeneralSettings = {
    instanceName: string;
    instanceDescription: string;
    instanceLogo: string;
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    maxSecretsPerUser: number;
    defaultSecretExpiration: number;
    maxSecretSize: number;
    importantMessage: string;
};

type SecuritySettings = {
    enforceHttps: boolean;
    allowPasswordProtection: boolean;
    allowIpRestriction: boolean;
    allowFileUploads: boolean;
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
    disableEmailPasswordSignup: boolean;
};

type WebhookSettings = {
    webhookEnabled: boolean;
    webhookUrl: string;
    webhookSecret: string;
    webhookOnView: boolean;
    webhookOnBurn: boolean;
};

type MetricsSettings = {
    metricsEnabled: boolean;
    metricsSecret: string;
};

type AllSettings = GeneralSettings &
    SecuritySettings &
    OrganizationSettings &
    WebhookSettings &
    MetricsSettings;

type HemmeligState = {
    // Public settings (read-only for most components)
    settings: Partial<HemmeligSettings>;
    setSettings: (settings: HemmeligSettings) => void;

    // Admin settings (categorized for InstancePage)
    generalSettings: GeneralSettings;
    securitySettings: SecuritySettings;
    organizationSettings: OrganizationSettings;
    webhookSettings: WebhookSettings;
    metricsSettings: MetricsSettings;
    isLoading: boolean;
    error: string | null;

    // Admin actions
    initializeAdminSettings: (settings: AllSettings) => void;
    fetchAdminSettings: () => Promise<void>;
    setGeneralSetting: <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => void;
    setSecuritySetting: <K extends keyof SecuritySettings>(
        key: K,
        value: SecuritySettings[K]
    ) => void;
    setOrganizationSetting: <K extends keyof OrganizationSettings>(
        key: K,
        value: OrganizationSettings[K]
    ) => void;
    setWebhookSetting: <K extends keyof WebhookSettings>(key: K, value: WebhookSettings[K]) => void;
    setMetricsSetting: <K extends keyof MetricsSettings>(key: K, value: MetricsSettings[K]) => void;
    saveSettings: (
        section: 'general' | 'security' | 'organization' | 'webhook' | 'metrics'
    ) => Promise<void>;
};

export const useHemmeligStore = create<HemmeligState>((set, get) => ({
    // Public settings (simple flat object for reading)
    settings: {
        instanceName: '',
        instanceDescription: '',
        instanceLogo: '',
        allowRegistration: true,
        requireInviteCode: false,
        requireRegisteredUser: false,
        disableEmailPasswordSignup: false,
        allowFileUploads: true,
        importantMessage: '',
    },
    setSettings: (settings) => {
        set({ settings });
        if (settings.instanceName) {
            document.title = settings.instanceName;
        }
    },

    // Admin settings (categorized)
    generalSettings: {
        instanceName: '',
        instanceDescription: '',
        instanceLogo: '',
        allowRegistration: true,
        requireEmailVerification: false,
        maxSecretsPerUser: 1000,
        defaultSecretExpiration: 72,
        maxSecretSize: 1024,
        importantMessage: '',
    },
    securitySettings: {
        enforceHttps: true,
        allowPasswordProtection: true,
        allowIpRestriction: true,
        allowFileUploads: true,
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
        disableEmailPasswordSignup: false,
    },
    webhookSettings: {
        webhookEnabled: false,
        webhookUrl: '',
        webhookSecret: '',
        webhookOnView: true,
        webhookOnBurn: true,
    },
    metricsSettings: {
        metricsEnabled: false,
        metricsSecret: '',
    },
    isLoading: false,
    error: null,

    initializeAdminSettings: (settings) => {
        set({
            generalSettings: {
                instanceName: settings.instanceName,
                instanceDescription: settings.instanceDescription,
                instanceLogo: settings.instanceLogo ?? '',
                allowRegistration: settings.allowRegistration,
                requireEmailVerification: settings.requireEmailVerification,
                maxSecretsPerUser: settings.maxSecretsPerUser,
                defaultSecretExpiration: settings.defaultSecretExpiration,
                maxSecretSize: settings.maxSecretSize,
                importantMessage: settings.importantMessage ?? '',
            },
            securitySettings: {
                enforceHttps: settings.enforceHttps,
                allowPasswordProtection: settings.allowPasswordProtection,
                allowIpRestriction: settings.allowIpRestriction,
                allowFileUploads: settings.allowFileUploads ?? true,
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
                disableEmailPasswordSignup: settings.disableEmailPasswordSignup ?? false,
            },
            webhookSettings: {
                webhookEnabled: settings.webhookEnabled ?? false,
                webhookUrl: settings.webhookUrl ?? '',
                webhookSecret: settings.webhookSecret ?? '',
                webhookOnView: settings.webhookOnView ?? true,
                webhookOnBurn: settings.webhookOnBurn ?? true,
            },
            metricsSettings: {
                metricsEnabled: settings.metricsEnabled ?? false,
                metricsSecret: settings.metricsSecret ?? '',
            },
            isLoading: false,
        });
    },

    fetchAdminSettings: async () => {
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
            get().initializeAdminSettings(settings);
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

    setWebhookSetting: (key, value) => {
        set((state) => ({
            webhookSettings: { ...state.webhookSettings, [key]: value },
        }));
    },

    setMetricsSetting: (key, value) => {
        set((state) => ({
            metricsSettings: { ...state.metricsSettings, [key]: value },
        }));
    },

    saveSettings: async (section) => {
        set({ isLoading: true });
        try {
            const state = get();
            const settingsMap = {
                general: state.generalSettings,
                security: state.securitySettings,
                organization: state.organizationSettings,
                webhook: state.webhookSettings,
                metrics: state.metricsSettings,
            };

            await api.instance.settings.$put({ json: settingsMap[section] });
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

// Backwards compatibility alias for instanceStore
export const useInstanceStore = useHemmeligStore;
