import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'en', label: 'EN' },
    { code: 'de', label: 'DE' },
    { code: 'es', label: 'ES' },
    { code: 'fr', label: 'FR' },
    { code: 'it', label: 'IT' },
    { code: 'nl', label: 'NL' },
    { code: 'zh', label: '中文' },
] as const;

export function LanguagePicker() {
    const { i18n } = useTranslation();

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        i18n.changeLanguage(e.target.value);
    };

    return (
        <select
            value={i18n.language}
            onChange={handleLanguageChange}
            className="bg-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 text-xs cursor-pointer border-none outline-none appearance-none pr-1"
            aria-label="Select language"
        >
            {LANGUAGES.map((lang) => (
                <option
                    key={lang.code}
                    value={lang.code}
                    className="bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                >
                    {lang.label}
                </option>
            ))}
        </select>
    );
}
