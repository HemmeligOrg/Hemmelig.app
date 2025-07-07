import { create } from 'zustand';

export type HemmeligSettings = {
    instanceName: string;
    instanceDescription: string;
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    maxSecretsPerUser: number;
    defaultSecretExpiration: number;
    maxSecretSize: number;
    enforceHttps: boolean;
    allowPasswordProtection: boolean;
    allowIpRestriction: boolean;
    maxPasswordAttempts: number;
    sessionTimeout: number;
    enableRateLimiting: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUsername: string | null;
    smtpPassword: string | null;
    smtpSecure: boolean;
    fromEmail: string | null;
    fromName: string | null;
};

type HemmeligState = {
    settings: Partial<HemmeligSettings>;
    setSettings: (settings: HemmeligSettings) => void;
};

export const useHemmeligStore = create<HemmeligState>((set) => ({
    settings: {
        instanceName: 'Hemmelig',
        instanceDescription: 'Share secrets securely.',
        allowRegistration: true,
    },
    setSettings: (settings) => {
        set({ settings });
        if (settings.instanceName) {
            document.title = settings.instanceName;
        }
    },
}));
