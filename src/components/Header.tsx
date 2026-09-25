import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useHemmeligStore } from '../store/hemmeligStore.ts';
import { useSecretStore } from '../store/secretStore.ts';
import { useUserStore } from '../store/userStore.ts';
import { Avatar } from './Avatar.tsx';
import { buttonClassName } from './Button.tsx';
import { ImportantAlert } from './ImportantAlert.tsx';
import { InstanceLogo } from './Logo.tsx';

/** The public top bar: the notice banner, the instance brand and the account links. */
export function Header() {
    const { t } = useTranslation();
    const { user } = useUserStore();
    const { settings } = useHemmeligStore();
    const resetSecret = useSecretStore((s) => s.resetSecret);

    return (
        <>
            <ImportantAlert />
            <header className="border-b border-line-soft">
                <div className="max-w-page mx-auto px-6 h-15 flex items-center gap-4">
                    <Link
                        to="/"
                        onClick={resetSecret}
                        className="flex items-center gap-2.5 font-mono font-medium text-body text-fg hover:text-fg"
                    >
                        <InstanceLogo
                            imageClassName="h-5 w-auto max-w-32 object-contain"
                            className="w-5 h-5 fill-current"
                        />
                        <span>{settings.instanceName || 'hemmelig'}</span>
                    </Link>

                    <nav className="ml-auto flex items-center gap-3.5">
                        {user ? (
                            <>
                                <Link to="/dashboard" className="text-sm text-fg-2 hover:text-fg">
                                    {t('header.dashboard')}
                                </Link>
                                <Link
                                    to="/dashboard/account"
                                    aria-label={t('dashboard_layout.account')}
                                    className="rounded-full"
                                >
                                    <Avatar name={user.username} />
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm text-fg-2 hover:text-fg">
                                    {t('header.sign_in')}
                                </Link>
                                {settings.allowRegistration && (
                                    <Link
                                        to="/register"
                                        className={buttonClassName({
                                            variant: 'secondary',
                                            size: 'sm',
                                            className: 'py-1.5',
                                        })}
                                    >
                                        {t('header.sign_up')}
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </div>
            </header>
        </>
    );
}
