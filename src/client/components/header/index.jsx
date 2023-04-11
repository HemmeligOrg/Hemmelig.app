import { Link, Redirect } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Anchor, Burger, NavLink, Container, Group, Grid } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconUser, IconLockOff, IconLogin } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import { userLoginChanged, userLogin } from '../../actions/';
import Logo from './logo.jsx';
import { getCookie, removeCookie } from '../../helpers/cookie';
import { signOut } from '../../api/authentication';

import style from './style.module.css';

const Header = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const isLoggedIn = useSelector((state) => state.isLoggedIn);
    const username = useSelector((state) => state.username);

    const [opened, { toggle }] = useDisclosure(false);
    const [onSignOutRedirect, setOnSignOutRedirect] = useState(false);
    const isMobile = useMediaQuery('(max-width: 768px)');

    const label = opened ? 'Close navigation' : 'Open navigation';

    useEffect(() => {
        if (!isLoggedIn && username) {
            dispatch(userLoginChanged(true));
        }

        const cookie = getCookie();

        if (!isLoggedIn && !username && cookie) {
            dispatch(userLogin(cookie));
            dispatch(userLoginChanged(true));
        }
    }, [isLoggedIn, username]);

    const onSignOut = () => {
        toggle();

        removeCookie();

        signOut();

        dispatch(userLogin({ username: '' }));
        dispatch(userLoginChanged(false));

        setOnSignOutRedirect(true);
    };

    const getNavigation = () => {
        if (!opened) {
            return <></>;
        }

        return (
            <Group spacing="xs" className={style.nav}>
                {!isLoggedIn && (
                    <>
                        <NavLink
                            label={t('sign_up')}
                            icon={<IconUser size="1rem" stroke={1.5} />}
                            component={Link}
                            onClick={toggle}
                            to="/signup"
                        />
                        <NavLink
                            label={t('sign_in')}
                            icon={<IconLogin size="1rem" stroke={1.5} />}
                            component={Link}
                            onClick={toggle}
                            to="/signin"
                        />
                    </>
                )}

                {isLoggedIn && (
                    <NavLink
                        label={t('sign_out')}
                        icon={<IconLockOff size="1rem" stroke={1.5} />}
                        onClick={onSignOut}
                    />
                )}

                <NavLink
                    label={t('account')}
                    icon={<IconUser size="1rem" stroke={1.5} />}
                    component={Link}
                    onClick={toggle}
                    to="/account"
                />

                {isMobile && (
                    <>
                        <NavLink label="Privacy" component={Link} onClick={toggle} to="/privacy" />

                        <NavLink
                            label="Terms & Condition"
                            component={Link}
                            onClick={toggle}
                            to="/terms"
                        />
                    </>
                )}
            </Group>
        );
    };

    return (
        <Container>
            <Grid columns={24} align="center">
                <Grid.Col span={20}>
                    <Anchor component={Link} to="/">
                        <Logo className={style.logo} />
                    </Anchor>
                </Grid.Col>

                <Grid.Col span={4}>
                    <Group position="right">
                        <Burger opened={opened} onClick={toggle} aria-label={label} />
                    </Group>
                </Grid.Col>

                {getNavigation()}

                {onSignOutRedirect && <Redirect push to="/signin" />}
            </Grid>
        </Container>
    );
};

export default Header;
