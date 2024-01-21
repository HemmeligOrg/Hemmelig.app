import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Anchor, Burger, Container, Group, Grid, Modal, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import Nav from './nav';
import { userLoginChanged, userLogin } from '../../actions/';
import Logo from './logo.jsx';
import { getCookie, refreshCookie } from '../../helpers/cookie';

import style from './style.module.css';
import { refresh } from '../../api/authentication.js';

const Header = () => {
    const dispatch = useDispatch();

    const isLoggedIn = useSelector((state) => state.isLoggedIn);
    const username = useSelector((state) => state.username);

    const [opened, { toggle }] = useDisclosure(false);
    const [openRefreshModal, { open, close }] = useDisclosure(false);
    const [redirect, setRedirect] = useState(false);

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

    // This use effect will check if the cookie is about to expire
    useEffect(() => {
        const cookie = getCookie();

        if (!cookie) {
            return;
        }

        const interval = setInterval(() => {
            const shouldRefresh = refreshCookie();
            if (shouldRefresh && !openRefreshModal) {
                open();
            }
        }, 60 * 1000);

        return () => clearInterval(interval);
    }, [openRefreshModal]);

    const label = opened ? 'Close navigation' : 'Open navigation';

    const handleRefreshCookie = async () => {
        const cookie = getCookie();

        if (!cookie) {
            return;
        }

        const data = await refresh();

        if (data.statusCode === 401) {
            setRedirect(true);
            close();
        }

        dispatch(userLogin(cookie));
        dispatch(userLoginChanged(true));

        close();
    };

    return (
        <>
            {redirect && <Navigate to="/signin" />}

            <Modal opened={openRefreshModal} onClose={close} title="Authentication">
                <p>Your session is about to expire. Do you want to extend it?</p>
                <Button onClick={handleRefreshCookie} color="hemmelig">
                    Update session
                </Button>
            </Modal>

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
        </>
    );
};

export default Header;
