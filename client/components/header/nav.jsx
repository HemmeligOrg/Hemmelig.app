import { IconFingerprint, IconList, IconLockOff, IconLogin, IconUser } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Nav = ({ opened, toggle, isLoggedIn }) => {
    const { t } = useTranslation();

    const navItems = [];

    if (!isLoggedIn) {
        navItems.push({
            label: t('sign_up'),
            icon: <IconUser size="1rem" stroke={1.5} />,
            to: '/signup',
        });
        navItems.push({
            label: t('sign_in'),
            icon: <IconLogin size="1rem" stroke={1.5} />,
            to: '/signin',
        });
    }

    if (isLoggedIn) {
        navItems.push({
            label: t('sign_out'),
            icon: <IconLockOff size="1rem" stroke={1.5} />,
            to: '/signout',
        });
    }

    navItems.push(
        {
            label: t('account.home.title'),
            icon: <IconUser size="1rem" stroke={1.5} />,
            to: '/account',
        },
        {
            label: t('public_list'),
            icon: <IconList size="1rem" stroke={1.5} />,
            to: '/public',
        }
    );

    navItems.push({
        label: t('privacy.title'),
        icon: <IconFingerprint size="1rem" stroke={1.5} />,
        to: '/privacy',
    });
    navItems.push({
        label: t('terms.title'),
        icon: <IconList size="1rem" stroke={1.5} />,
        to: '/terms',
    });

    if (!opened) {
        return null;
    }

    return (
        <nav className="w-full md:w-auto bg-gray-900 md:bg-transparent">
            <div className="flex flex-col md:flex-row gap-1 p-2">
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        to={item.to}
                        onClick={toggle}
                        className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 
                                 rounded-md transition-colors duration-200"
                    >
                        <span className="text-gray-400">{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
};

export default Nav;
