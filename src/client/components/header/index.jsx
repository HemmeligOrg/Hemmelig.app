import { Link, Redirect } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Anchor, Button, Container, Group, Grid } from '@mantine/core';
import { IconLockOff, IconLogin } from '@tabler/icons';
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

    const [onSignOutRedirect, setOnSignOutRedirect] = useState(false);

    useEffect(() => {
        if (!isLoggedIn && username) {
            dispatch(userLoginChanged(true));
        }

        const cookie = getCookie();

        if (!isLoggedIn && !username && cookie) {
            dispatch(userLogin(cookie));
            dispatch(userLoginChanged(true));
        }
    }, []);

    const onSignOut = (event) => {
        event.preventDefault();

        removeCookie();

        signOut();

        dispatch(userLogin({ username: '' }));
        dispatch(userLoginChanged(false));

        setOnSignOutRedirect(true);
    };

    return (
        <Container>
            <Grid columns={24} align="center">
                <Grid.Col span={16}>
                    <Anchor component={Link} to="/">
                        <Logo className={style.logo} />
                    </Anchor>
                </Grid.Col>

                {isLoggedIn && (
                    <Grid.Col span={8}>
                        <Group position="right">
                            <Button
                                color="hemmelig"
                                leftIcon={<IconLockOff size={14} />}
                                onClick={onSignOut}
                            >
                                {t('sign_out')}
                            </Button>
                        </Group>
                    </Grid.Col>
                )}

                {!isLoggedIn && (
                    <>
                        <Grid.Col span={4}>
                            <Group position="right">
                                <Button
                                    variant="subtle"
                                    color="hemmelig"
                                    component={Link}
                                    to="/signin"
                                >
                                    {t('sign_in')}
                                </Button>
                            </Group>
                        </Grid.Col>

                        <Grid.Col span={4}>
                            <Group position="right">
                                <Button
                                    color="hemmelig"
                                    leftIcon={<IconLogin size={14} />}
                                    component={Link}
                                    to="/signup"
                                >
                                    {t('sign_up')}
                                </Button>
                            </Group>
                        </Grid.Col>
                    </>
                )}
                {onSignOutRedirect && <Redirect to="/signin" />}
            </Grid>
        </Container>
    );
};

export default Header;
