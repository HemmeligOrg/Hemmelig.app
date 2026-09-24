import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/themeStore';

export function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();
    const { t } = useTranslation();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="p-1 text-muted hover:text-fg transition-colors cursor-pointer"
            aria-label={
                theme === 'dark'
                    ? t('theme_toggle.switch_to_light')
                    : t('theme_toggle.switch_to_dark')
            }
        >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
    );
}
