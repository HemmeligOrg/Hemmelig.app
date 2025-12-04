import { AlertTriangle, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useRouteError } from 'react-router-dom';

export function SecretNotFoundPage() {
    const error = useRouteError() as Error;
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6 shadow-xl max-w-md w-full">
                <div className="flex justify-center mb-3">
                    <div className="bg-red-500/20 p-2">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('secret_not_found_page.title')}
                </h1>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">
                    {t('secret_not_found_page.message')}
                </p>

                {error && (
                    <div className="bg-gray-100 dark:bg-dark-700/50 p-3 text-left text-sm text-gray-600 dark:text-slate-300 mb-4">
                        <p className="font-semibold">{t('secret_not_found_page.error_details')}</p>
                        <pre className="whitespace-pre-wrap break-words">{error.message}</pre>
                    </div>
                )}

                <Link
                    to="/"
                    className="inline-flex items-center gap-2 justify-center bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white shadow-sm transition-all duration-150 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <Home className="w-4 h-4" />
                    <span>{t('secret_not_found_page.go_home_button')}</span>
                </Link>
            </div>
        </div>
    );
}
