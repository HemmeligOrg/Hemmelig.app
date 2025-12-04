import { CircleUser, LogIn, UserPlus } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useHemmeligStore } from '../store/hemmeligStore.ts';
import { useUserStore } from '../store/userStore.ts';
import Logo from './Logo.tsx';

export function Header() {
    const { t } = useTranslation();
    const { user, fetchUser } = useUserStore();
    const { settings } = useHemmeligStore();

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    return (
        <header className="pt-4 sm:pt-8 pb-4 sm:pb-6">
            <div className="container mx-auto px-4">
                {/* Navigation */}
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <Link
                        to="/"
                        className="flex items-center space-x-2 text-gray-900 dark:text-white hover:text-teal-500 dark:hover:text-teal-400 transition-colors duration-300"
                    >
                        <Logo className="w-5 h-5 sm:w-6 sm:h-6 fill-gray-900 dark:fill-white" />
                        <span className="text-lg sm:text-xl font-bold">Hemmelig</span>
                    </Link>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {user ? (
                            <Link
                                to="/dashboard"
                                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-teal-500 hover:bg-teal-600 text-gray-900 dark:text-white transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                            >
                                <CircleUser className="w-4 h-4" />
                                <span className="hidden xs:inline">{t('header.dashboard')}</span>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 text-sm sm:text-base"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span className="hidden xs:inline">{t('header.sign_in')}</span>
                                </Link>
                                <Link
                                    to="/register"
                                    className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-teal-500 hover:bg-teal-600 text-gray-900 dark:text-white transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span className="hidden xs:inline">{t('header.sign_up')}</span>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Hero Section */}
                <div className="text-center">
                    <div className="flex items-center justify-center mb-3 sm:mb-4">
                        <div className="relative">
                            <Logo className="w-12 h-12 sm:w-14 sm:h-14 fill-gray-900 dark:fill-white" />
                        </div>
                    </div>

                    {settings.instanceName ? (
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                            {settings.instanceName}
                        </h1>
                    ) : (
                        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 tracking-tight">
                            Hemmelig
                            <span className="text-teal-500 dark:text-teal-400">.app</span>
                        </h1>
                    )}

                    {settings.instanceDescription ? (
                        <p className="mt-4 text-base leading-7 text-gray-600 dark:text-slate-300">
                            {settings.instanceDescription}
                        </p>
                    ) : (
                        <p className="text-sm sm:text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed px-4">
                            {t('header.hero_text_part1')}
                            <span className="text-teal-500 dark:text-teal-400 font-medium">
                                {t('header.hero_text_part2')}
                            </span>
                            {t('header.hero_text_part3')}
                        </p>
                    )}
                </div>
            </div>
        </header>
    );
}
