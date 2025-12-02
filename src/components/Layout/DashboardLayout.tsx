import React, { useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
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
import { createAuthClient } from 'better-auth/react';
import { useUserStore } from '../../store/userStore';
import { ThemeToggle } from '../ThemeToggle';

const authClient = createAuthClient({ baseURL: window.location.origin });

export function DashboardLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading, fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = '/login';
  };

  const navigation = [
    { name: 'Secrets', href: '/dashboard', icon: Shield },
    { name: 'Account', href: '/dashboard/account', icon: User },
    //...(user?.isAdmin ? [
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Instance', href: '/dashboard/instance', icon: Server },
    //] : []),
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-light-800 dark:bg-dark-900">
      <div className="relative">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-light-800/90 dark:bg-dark-900/90 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-600 z-50">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-600">
                <Link to="/" className="flex items-center space-x-2 text-gray-900 dark:text-white">
                  <Logo className="w-5 h-5 sm:w-6 sm:h-6 fill-gray-900 dark:fill-white" />
                  <span className="text-xl font-bold">{t('dashboard_layout.hemmelig')}</span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
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
                      className={`flex items-center space-x-3 px-3 py-2 transition-all duration-200 ${isActive(item.href)
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                        : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-600'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                <button onClick={handleLogout} className="flex items-center space-x-3 px-3 py-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-600 w-full">
                  <LogOut className="w-5 h-5" />
                  <span>{t('dashboard_layout.sign_out')}</span>
                </button>
              </nav>
            </div>
          </div>
        )}

        <div className="flex">
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
            <div className="flex flex-col flex-1 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-600">
              {/* Logo */}
              <div className="flex items-center px-6 py-6 border-b border-gray-200 dark:border-dark-600">
                <Link to="/" className="flex items-center space-x-2 text-gray-900 dark:text-white hover:text-teal-400 transition-colors duration-300">
                  <Logo className="w-5 h-5 sm:w-6 sm:h-6 fill-gray-900 dark:fill-white" />
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
                      className={`flex items-center space-x-3 px-3 py-2 transition-all duration-200 ${isActive(item.href)
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                        : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-600'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* User info */}
              <div className="px-4 py-4 border-t border-gray-200 dark:border-dark-600">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-900 dark:text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {isLoading ? (
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Loading...</p>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.username}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <ThemeToggle />
                </div>
                <button onClick={handleLogout} className="flex items-center space-x-2 w-full px-3 py-2 mt-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">{t('dashboard_layout.sign_out')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 lg:pl-64">
            {/* Mobile header */}
            <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between p-4 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link to="/" className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <Logo className="w-5 h-5 sm:w-6 sm:h-6 fill-gray-900 dark:fill-white" />
                <span className="text-xl font-bold">Hemmelig</span>
              </Link>
              <ThemeToggle />
            </div>

            {/* Page content */}
            <main className="relative">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

