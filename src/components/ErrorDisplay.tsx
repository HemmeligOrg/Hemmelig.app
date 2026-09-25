import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErrorStore } from '../store/errorStore';

const ErrorDisplay = () => {
    const { errors, clearErrors } = useErrorStore();
    const { t } = useTranslation();

    useEffect(() => {
        if (errors.length > 0) {
            const timer = setTimeout(() => {
                clearErrors();
            }, 5000); // Clear errors after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [errors, clearErrors]);

    if (errors.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 grid gap-2 w-[calc(100%-2rem)] max-w-sm">
            {errors.map((error, index) => (
                <div
                    key={index}
                    className="flex justify-between items-start gap-3 px-4 py-3 bg-surface border border-danger/45 rounded-md shadow-2xl text-ui text-fg"
                    role="alert"
                >
                    <span className="flex gap-2.5">
                        <span className="mt-1.5 flex-none w-2 h-2 bg-danger" aria-hidden="true" />
                        {error}
                    </span>
                    <button
                        type="button"
                        onClick={clearErrors}
                        className="text-muted hover:text-fg transition-colors cursor-pointer"
                        title={t('error_display.clear_errors_button_title')}
                        aria-label={t('error_display.clear_errors_button_title')}
                    >
                        &times;
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ErrorDisplay;
