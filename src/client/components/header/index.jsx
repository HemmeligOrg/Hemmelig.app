import { Link, Redirect } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Anchor, Button, Container, Group, Grid } from '@mantine/core';
import { IconLockOff, IconLogin } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import { userLoginChanged, userLogin } from '../../actions/';
import Logo from './logo.jsx';
import { removeCookie } from '../../helpers/cookie';
import { signOut, verify } from '../../api/authentication';
import config from '../../config';

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

        (async () => {
            // TODO: Change the behaviour later on to save the redux state
            // in the local storage for a certain amount of time
            // instead of do an API verify to get the user data
            if (!isLoggedIn && !username) {
                const json = await verify();

                if (json?.statusCode === 401) {
                    return;
                }

                dispatch(userLogin(json));
                dispatch(userLoginChanged(true));
            }
        })();
    }, [isLoggedIn, username, dispatch]);

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
