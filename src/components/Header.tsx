import { Link } from 'react-router-dom';
import { LogIn, UserPlus, LayoutDashboard } from 'lucide-react';
import Logo from './Logo.tsx';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../store/userStore.ts';
import { useEffect } from 'react';

export function Header() {
    const { t } = useTranslation();
    const { user, fetchUser } = useUserStore();

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    return (
        <header className="pt-6 sm:pt-12 pb-6 sm:pb-8">
            <div className="container mx-auto px-4">
                {/* Navigation */}
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                    <Link to="/" className="flex items-center space-x-2 text-white hover:text-teal-400 transition-colors duration-300">
                        <Logo className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                        <span className="text-lg sm:text-xl font-bold">Hemmelig</span>
                    </Link>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {user ? (
                            <Link
                                to="/dashboard"
                                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span className="hidden xs:inline">{t('header.dashboard')}</span>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-slate-300 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span className="hidden xs:inline">{t('header.sign_in')}</span>
                                </Link>
                                <Link
                                    to="/register"
                                    className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base"
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
                    <div className="flex items-center justify-center mb-4 sm:mb-6">
                        <div className="relative">
                            <Logo className="w-16 h-16 sm:w-16 sm:h-16 fill-white" />
                        </div>
                    </div>

                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
                        Hemmelig
                        <span className="text-teal-400">.app</span>
                    </h1>

                    <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed px-4">
                        {t('header.hero_text_part1')}
                        <span className="text-teal-400 font-medium">{t('header.hero_text_part2')}</span>{t('header.hero_text_part3')}
                    </p>
                </div>
            </div>
        </header>
    );
}
