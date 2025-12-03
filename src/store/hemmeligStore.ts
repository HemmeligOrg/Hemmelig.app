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
    requireInviteCode: boolean;
    requireRegisteredUser: boolean;
    logoUrl: string;
    primaryColor: string;
};

type HemmeligState = {
    settings: Partial<HemmeligSettings>;
    setSettings: (settings: HemmeligSettings) => void;
};

export const useHemmeligStore = create<HemmeligState>((set) => ({
    settings: {
        instanceName: '',
        instanceDescription: '',
        allowRegistration: true,
        requireInviteCode: false,
        requireRegisteredUser: false,
    },
    setSettings: (settings) => {
        set({ settings });
        if (settings.instanceName) {
            document.title = settings.instanceName;
        }
    },
}));
