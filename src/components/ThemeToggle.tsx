import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/themeStore';

export function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();
    const { t } = useTranslation();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            aria-label={
                theme === 'dark'
                    ? t('theme_toggle.switch_to_light')
                    : t('theme_toggle.switch_to_dark')
            }
        >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
    );
}
