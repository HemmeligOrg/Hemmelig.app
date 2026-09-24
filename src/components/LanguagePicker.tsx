import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'en', label: 'EN' },
    { code: 'da', label: 'DA' },
    { code: 'de', label: 'DE' },
    { code: 'es', label: 'ES' },
    { code: 'fr', label: 'FR' },
    { code: 'it', label: 'IT' },
    { code: 'nl', label: 'NL' },
    { code: 'no', label: 'NO' },
    { code: 'pt', label: 'PT' },
    { code: 'sv', label: 'SV' },
    { code: 'zh', label: '中文' },
] as const;

export function LanguagePicker() {
    const { i18n, t } = useTranslation();

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        i18n.changeLanguage(e.target.value);
    };

    return (
        <select
            value={i18n.resolvedLanguage ?? i18n.language}
            onChange={handleLanguageChange}
            className="bg-transparent font-mono text-xs text-muted hover:text-fg cursor-pointer border-none outline-none appearance-none focus-visible:outline-2 focus-visible:outline-accent"
            aria-label={t('language_picker.label')}
        >
            {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                    {lang.label}
                </option>
            ))}
        </select>
    );
}
