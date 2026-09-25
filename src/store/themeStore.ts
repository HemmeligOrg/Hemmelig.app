import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

/** The instance default theme. `system` follows the operating system setting. */
export type DefaultTheme = Theme | 'system';

interface ThemeState {
    theme: Theme;
    /** True after the visitor chooses a theme. Then the instance default no longer applies. */
    hasUserChoice: boolean;
    /** The instance default that applies while the visitor has not chosen a theme. */
    defaultTheme: DefaultTheme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
    applyDefaultTheme: (defaultTheme?: DefaultTheme) => void;
}

const applyThemeClass = (theme: Theme) => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};

/** Resolves `system` to the theme of the operating system. */
export const resolveTheme = (theme: DefaultTheme): Theme => {
    if (theme !== 'system') {
        return theme;
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'dark',
            hasUserChoice: false,
            defaultTheme: 'dark',
            setTheme: (theme: Theme) => {
                set({ theme });
                applyThemeClass(theme);
            },
            toggleTheme: () => {
                const newTheme = get().theme === 'dark' ? 'light' : 'dark';
                set({ hasUserChoice: true });
                get().setTheme(newTheme);
            },
            applyDefaultTheme: (defaultTheme) => {
                if (!defaultTheme) {
                    return;
                }
                set({ defaultTheme });
                if (!get().hasUserChoice) {
                    get().setTheme(resolveTheme(defaultTheme));
                }
            },
        }),
        {
            name: 'hemmelig-theme',
            version: 1,
            // Version 0 stored the theme only when the visitor toggled it, so a
            // stored version 0 state is a choice of the visitor.
            migrate: (persisted, version) => {
                const state = persisted as ThemeState;
                if (version === 0) {
                    return { ...state, hasUserChoice: true };
                }
                return state;
            },
            onRehydrateStorage: () => (state) => {
                applyThemeClass(state?.theme ?? 'dark');
            },
        }
    )
);
