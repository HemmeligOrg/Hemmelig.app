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
        <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-sm">
            {errors.map((error, index) => (
                <div
                    key={index}
                    className="bg-red-500 text-gray-900 dark:text-white p-3 shadow-lg flex justify-between items-center"
                    role="alert"
                >
                    <span>{error}</span>
                    <button
                        onClick={clearErrors}
                        className="ml-4 text-gray-900 dark:text-white hover:text-red-100 focus:outline-none"
                        title={t('error_display.clear_errors_button_title')}
                    >
                        &times;
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ErrorDisplay;
