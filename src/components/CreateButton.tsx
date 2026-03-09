import { Loader2, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CreateButtonProps {
    onSubmit: () => void;
    isLoading: boolean;
    disabled: boolean;
}

export function CreateButton({ onSubmit, isLoading, disabled }: CreateButtonProps) {
    const { t } = useTranslation();

    return (
        <div className="flex justify-center px-4">
            <button
                onClick={onSubmit}
                disabled={disabled || isLoading}
                className={`
                    flex items-center justify-center space-x-2 px-5 py-2 font-medium text-sm transition-all duration-200 w-full sm:w-auto min-w-[160px] touch-manipulation
                    ${
                        disabled || isLoading
                            ? 'bg-gray-300 dark:bg-dark-600 text-gray-500 dark:text-slate-400 cursor-not-allowed'
                            : 'bg-teal-500 hover:bg-teal-600 text-white'
                    }
                    focus:outline-none focus:ring-2 focus:ring-teal-500/30
                `}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('create_button.creating_secret')}</span>
                    </>
                ) : (
                    <>
                        <Send className="w-4 h-4" />
                        <span>{t('create_button.create')}</span>
                    </>
                )}
            </button>
        </div>
    );
}
