import { Link, Redirect } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Anchor, Button, Container, Group, Grid } from '@mantine/core';
import { IconDeviceDesktopAnalytics, IconLockOff, IconLogin } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import { userLoginChanged, userLogin } from '../../actions/';
import Logo from './logo.js';
import { hasToken, removeToken } from '../../helpers/token';
import config from '../../config';

import style from './style.module.css';

const Header = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const isLoggedIn = useSelector((state) => state.isLoggedIn);
    const [onSignOutRedirect, setOnSignOutRedirect] = useState(false);

    useEffect(() => {
        if (hasToken()) {
            dispatch(userLoginChanged(true));
        }
    }, [dispatch]);

    const onSignOut = (event) => {
        event.preventDefault();

        removeToken();
        dispatch(userLogin(null));
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

                {isLoggedIn && !config.get('settings.disableUsers') && (
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

                {!isLoggedIn && !config.get('settings.disableUsers') && (
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
