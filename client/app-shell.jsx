import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router-dom';
import HeaderContent from './components/header';

const ApplicationShell = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen flex flex-col bg-gray-900">
            {/* Header */}
            <header className="h-[75px] z-50 bg-gray-900 border-b border-gray-800">
                <HeaderContent />
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="h-[45px] bg-gray-900 border-t border-gray-800">
                <div className="h-full flex items-center justify-center gap-2">
                    {/* Desktop-only links */}
                    <div className="hidden md:flex md:items-center md:gap-2">
                        <Link
                            to="/account"
                            className="text-xs text-gray-400 hover:text-gray-200 uppercase transition-colors"
                        >
                            {t('account.home.title')}
                        </Link>

                        <span className="text-gray-600">|</span>

                        <Link
                            to="/privacy"
                            className="text-xs text-gray-400 hover:text-gray-200 uppercase transition-colors"
                        >
                            {t('privacy.title')}
                        </Link>

                        <span className="text-gray-600">|</span>

                        <Link
                            to="/terms"
                            className="text-xs text-gray-400 hover:text-gray-200 uppercase transition-colors"
                        >
                            {t('terms.title')}
                        </Link>

                        <span className="text-gray-600">|</span>
                    </div>

                    {/* Always visible links */}
                    <a
                        href="https://github.com/HemmeligOrg/Hemmelig.app"
                        rel="noreferrer"
                        className="text-xs text-gray-400 hover:text-gray-200 uppercase transition-colors"
                    >
                        <span className="text-xs">Github</span>
                    </a>
                </div>
            </footer>
        </div>
    );
};

export default ApplicationShell;
