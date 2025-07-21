import { toast } from 'sonner';
import { create } from 'zustand';
import { api } from '../lib/api';

// Helper function to format uptime
const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds -= days * 24 * 60 * 60;
    const hours = Math.floor(seconds / (60 * 60));
    seconds -= hours * 60 * 60;
    const minutes = Math.floor(seconds / 60);

    return `${days}d ${hours}h ${minutes}m`;
};

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

type EmailSettings = {
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUsername: string | null;
    smtpPassword: string | null;
    smtpSecure: boolean;
    fromEmail: string | null;
    fromName: string | null;
};

type SystemInfo = {
    version: string;
    uptime: string;
    totalSecrets: number;
    totalUsers: number;
    diskUsage: string;
    memoryUsage: string;
    cpuUsage: string;
    status: string;
};

type InstanceState = {
    systemInfo: SystemInfo;
    generalSettings: GeneralSettings;
    securitySettings: SecuritySettings;
    emailSettings: EmailSettings;
    isLoading: boolean;
    error: string | null;
    fetchStatus: () => Promise<void>;
    fetchSettings: () => Promise<void>;
    setGeneralSetting: <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => void;
    setSecuritySetting: <K extends keyof SecuritySettings>(
        key: K,
        value: SecuritySettings[K]
    ) => void;
    setEmailSetting: <K extends keyof EmailSettings>(key: K, value: EmailSettings[K]) => void;
    saveSettings: (section: 'general' | 'security' | 'email') => Promise<void>;
};

export const useInstanceStore = create<InstanceState>((set, get) => ({
    systemInfo: {
        version: '',
        uptime: '',
        totalSecrets: 0,
        totalUsers: 0,
        diskUsage: '',
        memoryUsage: '',
        cpuUsage: '',
        status: '',
    },
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
    emailSettings: {
        smtpHost: null,
        smtpPort: null,
        smtpUsername: null,
        smtpPassword: null,
        smtpSecure: true,
        fromEmail: null,
        fromName: null,
    },
    isLoading: false,
    error: null,

    fetchStatus: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.instance.status.$get();
            if (res.status === 403) {
                const errorMsg = "You don't have permission to view system status.";
                toast.error(errorMsg);
                set({ error: errorMsg, isLoading: false });
                return;
            }
            const data = await res.json();
            set({
                systemInfo: {
                    ...data,
                    uptime: formatUptime(data.uptime),
                    memoryUsage: `${(data.memoryUsage / 1024 / 1024).toFixed(2)} MB`,
                    cpuUsage: `${(data.cpuUsage * 100).toFixed(2)}%`,
                },
                isLoading: false,
            });
        } catch (error) {
            const errorMsg = 'Failed to fetch system status.';
            console.error(errorMsg, error);
            toast.error(errorMsg);
            set({ error: errorMsg, isLoading: false });
        }
    },

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
                emailSettings: {
                    smtpHost: settings.smtpHost,
                    smtpPort: settings.smtpPort,
                    smtpUsername: settings.smtpUsername,
                    smtpPassword: settings.smtpPassword,
                    smtpSecure: settings.smtpSecure,
                    fromEmail: settings.fromEmail,
                    fromName: settings.fromName,
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

    setEmailSetting: (key, value) => {
        set((state) => ({
            emailSettings: { ...state.emailSettings, [key]: value },
        }));
    },

    saveSettings: async (section) => {
        set({ isLoading: true });
        try {
            const { generalSettings, securitySettings, emailSettings } = get();
            let settingsToSave = {};
            if (section === 'general') {
                settingsToSave = generalSettings;
            } else if (section === 'security') {
                settingsToSave = securitySettings;
            } else if (section === 'email') {
                settingsToSave = emailSettings;
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
