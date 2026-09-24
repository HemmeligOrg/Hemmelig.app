import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { authClient } from '../../lib/auth';
import { useHemmeligStore } from '../../store/hemmeligStore';
import { useSecretStore } from '../../store/secretStore';
import { useUserStore } from '../../store/userStore';
import { Avatar } from '../Avatar';
import { buttonClassName } from '../Button';
import Logo from '../Logo';

interface NavItem {
    name: string;
    href: string;
}

const sectionLabelClass =
    'font-mono text-2xs text-faint uppercase tracking-wider px-2.5 pb-1.5 first:pt-0 pt-4.5';

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
    const { t } = useTranslation();
    const location = useLocation();
    const { user, isLoading } = useUserStore();
    const { settings } = useHemmeligStore();
    const resetSecret = useSecretStore((s) => s.resetSecret);

    const handleLogout = async () => {
        await authClient.signOut();
        window.location.href = '/login';
    };

    const workspace: NavItem[] = [
        { name: t('dashboard_layout.secrets'), href: '/dashboard' },
        { name: t('dashboard_layout.secret_requests'), href: '/dashboard/secret-requests' },
        { name: t('dashboard_layout.account'), href: '/dashboard/account' },
    ];

    const admin: NavItem[] = user?.isAdmin
        ? [
              { name: t('dashboard_layout.analytics'), href: '/dashboard/analytics' },
              { name: t('dashboard_layout.users'), href: '/dashboard/users' },
              ...(settings.requireInviteCode
                  ? [{ name: t('dashboard_layout.invites'), href: '/dashboard/invites' }]
                  : []),
              { name: t('dashboard_layout.instance'), href: '/dashboard/instance' },
          ]
        : [];

    const isActive = (href: string) =>
        href === '/dashboard'
            ? location.pathname === '/dashboard'
            : location.pathname.startsWith(href);

    const renderItem = (item: NavItem) => {
        const active = isActive(item.href);
        return (
            <Link
                key={item.href}
                to={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={`px-2.5 py-1.5 rounded-sm text-sm transition-colors ${
                    active
                        ? 'bg-raised text-fg shadow-[inset_2px_0_0_var(--color-accent)]'
                        : 'text-muted hover:text-fg'
                }`}
            >
                {item.name}
            </Link>
        );
    };

    return (
        <div className="flex flex-col gap-5.5 h-full px-3 py-4.5">
            <Link
                to="/"
                onClick={() => {
                    resetSecret();
                    onNavigate?.();
                }}
                className="flex items-center gap-2.5 px-2.5 py-1 font-mono font-medium text-body text-fg"
            >
                <Logo className="w-5 h-5 fill-current" aria-hidden="true" />
                <span>{settings.instanceName || 'hemmelig'}</span>
            </Link>

            <Link
                to="/"
                onClick={() => {
                    resetSecret();
                    onNavigate?.();
                }}
                className={buttonClassName({ variant: 'primary', size: 'md', className: 'w-full' })}
            >
                {t('dashboard_layout.new_secret')}
            </Link>

            <nav className="grid gap-0.5">
                <div className={sectionLabelClass}>{t('dashboard_layout.workspace')}</div>
                {workspace.map(renderItem)}
                {admin.length > 0 && (
                    <>
                        <div className={sectionLabelClass}>{t('dashboard_layout.admin')}</div>
                        {admin.map(renderItem)}
                    </>
                )}
            </nav>

            <div className="mt-auto grid gap-1.5 border-t border-line-soft pt-3.5">
                <Link
                    to="/dashboard/account"
                    onClick={onNavigate}
                    className="flex items-center gap-2.5 px-2.5 py-1 min-w-0"
                >
                    <Avatar name={user?.username} />
                    <span className="min-w-0">
                        {isLoading ? (
                            <span className="block text-ui">{t('common.loading')}</span>
                        ) : (
                            <>
                                <span className="block text-ui text-fg truncate">
                                    {user?.username}
                                </span>
                                <span className="block text-xs text-muted truncate">
                                    {user?.email}
                                </span>
                            </>
                        )}
                    </span>
                </Link>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="text-left px-2.5 py-1.5 text-ui text-muted hover:text-fg transition-colors cursor-pointer"
                >
                    {t('dashboard_layout.sign_out')}
                </button>
            </div>
        </div>
    );
}

export function DashboardLayout() {
    const { t } = useTranslation();
    const { settings } = useHemmeligStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-canvas text-fg lg:flex">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block flex-none w-58 border-r border-line-soft">
                <div className="sticky top-0 h-screen overflow-y-auto">
                    <Sidebar />
                </div>
            </aside>

            {/* Mobile top bar */}
            <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-canvas border-b border-line-soft">
                <Link to="/" className="flex items-center gap-2.5 font-mono font-medium text-body">
                    <Logo className="w-5 h-5 fill-current" aria-hidden="true" />
                    <span>{settings.instanceName || 'hemmelig'}</span>
                </Link>
                <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 text-muted hover:text-fg cursor-pointer"
                    aria-label={t('dashboard_layout.open_menu')}
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            {/* Mobile drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="absolute inset-y-0 left-0 w-64 max-w-[85vw] bg-canvas border-r border-line-soft">
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="absolute top-3.5 right-3 p-1.5 text-muted hover:text-fg cursor-pointer"
                            aria-label={t('dashboard_layout.close_menu')}
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            <main className="flex-1 min-w-0 px-[clamp(20px,4vw,48px)] py-9">
                <Outlet />
            </main>
        </div>
    );
}
