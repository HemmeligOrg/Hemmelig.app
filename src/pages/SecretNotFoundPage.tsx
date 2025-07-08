import { useRouteError, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Home } from 'lucide-react';

export function SecretNotFoundPage() {
    const error = useRouteError() as Error;
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl max-w-md w-full">
                <div className="flex justify-center mb-4">
                    <div className="bg-red-500/20 p-3 rounded-full">
                        <AlertTriangle className="w-10 h-10 text-red-400" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">{t('secret_not_found_page.title')}</h1>
                <p className="text-slate-400 mb-6">{t('secret_not_found_page.message')}</p>
                
                {error && (
                    <div className="bg-slate-700/50 p-4 rounded-lg text-left text-sm text-slate-300 mb-6">
                        <p className="font-semibold">{t('secret_not_found_page.error_details')}</p>
                        <pre className="whitespace-pre-wrap break-words">{error.message}</pre>
                    </div>
                )}

                <Link 
                    to="/"
                    className="inline-flex items-center gap-2 justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <Home className="w-5 h-5" />
                    <span>{t('secret_not_found_page.go_home_button')}</span>
                </Link>
            </div>
        </div>
    );
}
