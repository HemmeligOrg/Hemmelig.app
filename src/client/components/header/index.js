import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Anchor, Button, Container, Group, Grid } from '@mantine/core';
import { IconLockOff, IconLogin } from '@tabler/icons';
import { userLoginChanged } from '../../actions/';
import Logo from './logo.js';

import { hasToken, removeToken } from '../../helpers/token';

import style from './style.module.css';

const Header = () => {
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

        dispatch(userLoginChanged(false));

        setOnSignOutRedirect(true);
    };

    return (
        <Container>
            <Grid columns={24} align="center">
                <Grid.Col span={isLoggedIn ? 18 : 18}>
                    <Anchor component={Link} to="/">
                        <Logo className={style.logo} />
                    </Anchor>
                </Grid.Col>

                {isLoggedIn && (
                    <Grid.Col span={6}>
                        <Group position="right">
                            <Button
                                styles={() => ({
                                    root: {
                                        backgroundColor: 'var(--color-contrast)',

                                        '&:hover': {
                                            backgroundColor: 'var(--color-contrast)',
                                            filter: 'brightness(115%)',
                                        },
                                    },
                                })}
                                leftIcon={<IconLockOff size={14} />}
                                component={Link}
                                to="/signin"
                                onClick={onSignOut}
                            >
                                Sign out
                            </Button>
                        </Group>
                    </Grid.Col>
                )}

                {!isLoggedIn && (
                    <>
                        <Grid.Col span={3}>
                            <Group position="right">
                                <Button
                                    variant="subtle"
                                    styles={() => ({
                                        root: {
                                            color: 'var(--color-contrast)',

                                            '&:hover': {
                                                color: 'var(--color-contrast)',
                                                filter: 'brightness(115%)',
                                            },
                                        },
                                    })}
                                    component={Link}
                                    to="/signin"
                                >
                                    Sign in
                                </Button>
                            </Group>
                        </Grid.Col>

                        <Grid.Col span={3}>
                            <Group position="right">
                                <Button
                                    styles={() => ({
                                        root: {
                                            backgroundColor: 'var(--color-contrast)',

                                            '&:hover': {
                                                backgroundColor: 'var(--color-contrast)',
                                                filter: 'brightness(115%)',
                                            },
                                        },
                                    })}
                                    leftIcon={<IconLogin size={14} />}
                                    component={Link}
                                    to="/signup"
                                >
                                    Sign up
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
