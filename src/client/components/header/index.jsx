import { Link } from 'react-router-dom';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Anchor, Burger, Container, Group, Grid } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import Nav from './nav';
import { userLoginChanged, userLogin } from '../../actions/';
import Logo from './logo.jsx';
import { getCookie } from '../../helpers/cookie';

import style from './style.module.css';

const Header = () => {
    const dispatch = useDispatch();

    const isLoggedIn = useSelector((state) => state.isLoggedIn);
    const username = useSelector((state) => state.username);

    const [opened, { toggle }] = useDisclosure(false);

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

    const label = opened ? 'Close navigation' : 'Open navigation';

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

                <Nav isLoggedIn={isLoggedIn} opened={opened} toggle={toggle} />
            </Grid>
        </Container>
    );
};

export default Header;
