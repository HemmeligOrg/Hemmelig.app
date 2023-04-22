import { Link } from 'react-router-dom';
import { NavLink, Group } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconUser, IconLockOff, IconLogin, IconFingerprint, IconList } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

import style from './style.module.css';

const Nav = ({ opened, toggle, isLoggedIn }) => {
    const { t } = useTranslation();

    const isMobile = useMediaQuery('(max-width: 768px)');

    const navItems = [];

    if (!isLoggedIn) {
        navItems.push({
            label: t('sign_up'),
            icon: <IconUser size="1rem" stroke={1.5} />,
            component: Link,
            onClick: toggle,
            to: '/signup',
        });
        navItems.push({
            label: t('sign_in'),
            icon: <IconLogin size="1rem" stroke={1.5} />,
            component: Link,
            onClick: toggle,
            to: '/signin',
        });
    }

    if (isLoggedIn) {
        navItems.push({
            label: t('sign_out'),
            icon: <IconLockOff size="1rem" stroke={1.5} />,
            component: Link,
            onClick: toggle,
            to: '/signout',
        });
    }

    navItems.push({
        label: t('account'),
        icon: <IconUser size="1rem" stroke={1.5} />,
        component: Link,
        onClick: toggle,
        to: '/account',
    });

    if (isMobile) {
        navItems.push({
            label: 'Privacy',
            icon: <IconFingerprint size="1rem" stroke={1.5} />,
            component: Link,
            onClick: toggle,
            to: '/privacy',
        });
        navItems.push({
            label: 'Terms & Condition',
            icon: <IconList size="1rem" stroke={1.5} />,
            component: Link,
            onClick: toggle,
            to: '/terms',
        });
    }

    if (!opened) {
        return <></>;
    }

    return (
        <Group spacing="xs" className={style.nav}>
            {navItems.map((item) => (
                <NavLink
                    key={item.label}
                    label={item.label}
                    icon={item.icon}
                    component={item.component ? item.component : null}
                    onClick={item.onClick}
                    to={item.to ? item.to : null}
                />
            ))}
        </Group>
    );
};

export default Nav;
