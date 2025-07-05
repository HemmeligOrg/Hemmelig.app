import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Shield,
    User,
    BarChart3,
    Users,
    Server,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Logo from '../Logo';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { t } = useTranslation();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Mock user data - in real app this would come from auth context
    const user = {
        username: 'johndoe',
        email: 'john@example.com',
        isAdmin: true
    };

    const navigation = [
        { name: 'Secrets', href: '/dashboard', icon: Shield },
        { name: 'Account', href: '/dashboard/account', icon: User },
        ...(user.isAdmin ? [
            { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
            { name: 'Users', href: '/dashboard/users', icon: Users },
            { name: 'Instance', href: '/dashboard/instance', icon: Server },
        ] : []),
    ];

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="relative">
                {/* Background pattern */}
                <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

                {/* Mobile menu overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                        <div className="fixed inset-y-0 left-0 w-64 bg-slate-800/95 backdrop-blur-sm border-r border-slate-700/50">
                            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                                <Link to="/" className="flex items-center space-x-2 text-white">
                                    <Logo className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                                    <span className="text-xl font-bold">{t('dashboard_layout.hemmelig')}</span>
                                </Link>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 text-slate-400 hover:text-white transition-colors duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <nav className="p-4 space-y-2">
                                {navigation.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive(item.href)
                                                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                                                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                )}

                <div className="flex">
                    {/* Desktop Sidebar */}
                    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
                        <div className="flex flex-col flex-1 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50">
                            {/* Logo */}
                            <div className="flex items-center px-6 py-6 border-b border-slate-700/50">
                                <Link to="/" className="flex items-center space-x-2 text-white hover:text-teal-400 transition-colors duration-300">
                                    <Logo className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                                    <span className="text-xl font-bold">Hemmelig</span>
                                </Link>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 px-4 py-6 space-y-2">
                                {navigation.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive(item.href)
                                                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                                                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* User info */}
                            <div className="px-4 py-4 border-t border-slate-700/50">
                                <div className="flex items-center space-x-3 px-3 py-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{user.username}</p>
                                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                    </div>
                                </div>
                                <button className="flex items-center space-x-2 w-full px-3 py-2 mt-2 text-slate-400 hover:text-white transition-colors duration-200">
                                    <LogOut className="w-4 h-4" />
                                    <span className="text-sm">{t('dashboard_layout.sign_out')}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 lg:pl-64">
                        {/* Mobile header */}
                        <div className="lg:hidden flex items-center justify-between p-4 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-2 text-slate-400 hover:text-white transition-colors duration-200"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <Link to="/" className="flex items-center space-x-2 text-white">
                                <Logo className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                                <span className="text-xl font-bold">Hemmelig</span>
                            </Link>
                            <div className="w-10" /> {/* Spacer for centering */}
                        </div>

                        {/* Page content */}
                        <main className="relative">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}
