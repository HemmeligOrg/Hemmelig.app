import { Anchor, Burger, Button, Container, Grid, Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';

import { userLogin, userLoginChanged } from '../../actions/';
import { getCookie, refreshCookie } from '../../helpers/cookie';
import Logo from './logo.jsx';
import Nav from './nav';

import { refresh } from '../../api/authentication.js';
import style from './style.module.css';

const Header = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const isLoggedIn = useSelector((state) => state.isLoggedIn);
    const username = useSelector((state) => state.username);

    const [isMenuOpened, { toggle }] = useDisclosure(false);
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

        const refreshInterval = () => {
            const shouldRefresh = refreshCookie();
            if (shouldRefresh && !openRefreshModal) {
                open();
            }
        };

        refreshInterval();

        const interval = setInterval(refreshInterval, 60 * 1000);

        return () => clearInterval(interval);
    }, [openRefreshModal]);

    const label = isMenuOpened
        ? t('header.nav.close', 'Close navigation')
        : t('header.nav.open', 'Open navigation');

    const handleRefreshCookie = async () => {
        const cookie = getCookie();

        if (!cookie) {
            return;
        }

        const data = await refresh();

        if (data.statusCode === 401) {
            close();
            setRedirect(true);
        }

        dispatch(userLogin(cookie));
        dispatch(userLoginChanged(true));

        close();
    };

    return (
        <>
            {redirect && <Navigate to="/signout" />}

            <Modal
                opened={openRefreshModal}
                onClose={close}
                title={t('header.session.auth', 'Authentication')}
            >
                <p>
                    {t(
                        'header.session.expire',
                        'Your session is about to expire. Do you want to extend it?'
                    )}
                </p>
                <Button onClick={handleRefreshCookie} color="hemmelig">
                    {t('header.session.update', 'Update session')}
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
                            <Burger opened={isMenuOpened} onClick={toggle} aria-label={label} />
                        </Group>
                    </Grid.Col>

                    <Nav isLoggedIn={isLoggedIn} opened={isMenuOpened} toggle={toggle} />
                </Grid>
            </Container>
        </>
    );
};

export default Header;
