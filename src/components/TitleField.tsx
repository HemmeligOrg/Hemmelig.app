import { Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TitleFieldProps {
    value: string;
    onChange: (value: string) => void;
}

export function TitleField({ value, onChange }: TitleFieldProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-1">
            <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400">
                    <Hash className="w-4 h-4" />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={t('title_field.placeholder')}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                />
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 ml-1">
                {t('title_field.hint')}
            </p>
        </div>
    );
}
