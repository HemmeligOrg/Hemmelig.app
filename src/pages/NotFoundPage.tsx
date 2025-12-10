import { Ghost, Home, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6 shadow-xl max-w-md w-full">
                <div className="flex justify-center mb-3">
                    <div className="bg-slate-500/20 p-2">
                        <Ghost className="w-8 h-8 text-slate-400" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('not_found_page.title')}
                </h1>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">
                    {t('not_found_page.message')}
                </p>
                <p className="text-gray-400 dark:text-slate-500 text-xs mb-4">
                    {t('not_found_page.hint')}
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                        to="/"
                        className="flex-1 inline-flex items-center gap-2 justify-center bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white shadow-sm transition-all duration-150 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <Home className="w-4 h-4" />
                        <span>{t('not_found_page.go_home_button')}</span>
                    </Link>
                    <Link
                        to="/"
                        className="flex-1 inline-flex items-center gap-2 justify-center bg-gray-200 dark:bg-dark-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-300 shadow-sm transition-all duration-150 hover:bg-gray-300 dark:hover:bg-dark-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300"
                    >
                        <Search className="w-4 h-4" />
                        <span>{t('not_found_page.create_secret_button')}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
