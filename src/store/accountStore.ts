import { create } from 'zustand';

interface ProfileData {
    username: string;
    email: string;
}

interface AccountState {
    profileData: ProfileData;
    setProfileData: (data: ProfileData) => void;
}

export const useAccountStore = create<AccountState>((set) => ({
    profileData: { username: '', email: '' },
    setProfileData: (data) => set({ profileData: data }),
}));
