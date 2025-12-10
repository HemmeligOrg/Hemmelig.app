import { AlertOctagon, Home, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

export function ErrorBoundary() {
    const error = useRouteError();
    const { t } = useTranslation();

    const isRouteError = isRouteErrorResponse(error);
    const errorMessage = isRouteError
        ? error.statusText
        : error instanceof Error
          ? error.message
          : t('error_boundary.unknown_error');

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6 shadow-xl max-w-md w-full">
                <div className="flex justify-center mb-3">
                    <div className="bg-red-500/20 p-2">
                        <AlertOctagon className="w-8 h-8 text-red-400" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('error_boundary.title')}
                </h1>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">
                    {t('error_boundary.message')}
                </p>
                <p className="text-gray-400 dark:text-slate-500 text-xs mb-4">
                    {t('error_boundary.hint')}
                </p>

                {errorMessage && (
                    <div className="bg-gray-100 dark:bg-dark-700/50 p-3 text-left text-sm text-gray-600 dark:text-slate-300 mb-4">
                        <p className="font-semibold">{t('error_boundary.error_details')}</p>
                        <pre className="whitespace-pre-wrap break-words text-xs mt-1">
                            {errorMessage}
                        </pre>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={handleReload}
                        className="flex-1 inline-flex items-center gap-2 justify-center bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white shadow-sm transition-all duration-150 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>{t('error_boundary.try_again_button')}</span>
                    </button>
                    <Link
                        to="/"
                        className="flex-1 inline-flex items-center gap-2 justify-center bg-gray-200 dark:bg-dark-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-300 shadow-sm transition-all duration-150 hover:bg-gray-300 dark:hover:bg-dark-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300"
                    >
                        <Home className="w-4 h-4" />
                        <span>{t('error_boundary.go_home_button')}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
