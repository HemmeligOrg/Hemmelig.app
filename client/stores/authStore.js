import { create } from 'zustand';

const useAuthStore = create((set) => ({
    isLoggedIn: false,
    username: '',
    setLogin: (username) => set({ isLoggedIn: true, username }),
    setLogout: () => set({ isLoggedIn: false, username: '' }),
    setLoginStatus: (status) => set({ isLoggedIn: status }),
}));

export default useAuthStore;
