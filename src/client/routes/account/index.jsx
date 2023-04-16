import { useEffect, useState, lazy } from 'react';
import { Alert, Container, Loader, Text, Tabs } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconUser, IconSettings, IconAlertCircle, IconLock } from '@tabler/icons';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { getUser } from '../../api/account';

const Details = lazy(() => import('./details'));
const Settings = lazy(() => import('./settings'));
const Account = lazy(() => import('./account'));
const Users = lazy(() => import('./users'));
const Secrets = lazy(() => import('./secrets'));

import { useTranslation } from 'react-i18next';

const HomeAccount = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { tabValue } = useParams();

    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    const username = useSelector((state) => state.username);
    const isMobile = useMediaQuery('(max-width: 915px)');

    useEffect(() => {
        (async () => {
            try {
                const response = await getUser();

                if (response.statusCode === 401 || response.statusCode === 500) {
                    setError('Not logged in');

                    return;
                }

                setUser(response.user);

                setError(null);
            } catch (err) {
                setError(err);
            }
        })();
    }, []);

    if (!username) {
        return <Navigate replace to="/signin" />;
    }

    if (!user?.username) {
        return (
            <Container>
                <Loader color="teal" variant="bars" />
            </Container>
        );
    }

    return (
        <Container>
            {error && (
                <Alert
                    icon={<IconAlertCircle size="1rem" />}
                    title={t('home.bummer')}
                    color="red"
                    variant="outline"
                >
                    {error}
                </Alert>
            )}

            {user?.generated && (
                <Alert
                    icon={<IconAlertCircle size="1rem" />}
                    title="Update your password"
                    color="red"
                    variant="outline"
                >
                    If this is the first time you sign in on this user account, you should go to
                    Account settings and update your password.
                </Alert>
            )}

            <Tabs
                color="orange"
                orientation={isMobile ? 'horisontal' : 'vertical'}
                defaultValue="details"
                keepMounted={false}
                onTabChange={(value) => navigate(`/account/${value}`)}
                value={tabValue}
            >
                <Tabs.List grow={isMobile}>
                    <Tabs.Tab value="details" icon={<IconUser size={14} />}>
                        {t('account')}
                    </Tabs.Tab>
                    <Tabs.Tab value="secrets" icon={<IconLock size={14} />}>
                        {t('secrets.secrets')}
                    </Tabs.Tab>
                    <Tabs.Tab value="instance-settings" icon={<IconSettings size={14} />}>
                        {t('instance_settings')}
                    </Tabs.Tab>
                    <Tabs.Tab value="account-settings" icon={<IconUser size={14} />}>
                        {t('account_settings')}
                    </Tabs.Tab>
                    <Tabs.Tab value="users" icon={<IconUser size={14} />}>
                        {t('users.users')}
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="details" pt="xs">
                    <Container>
                        <Details user={user} />
                    </Container>
                </Tabs.Panel>

                <Tabs.Panel value="secrets" pt="xs">
                    <Secrets />
                </Tabs.Panel>
                <Tabs.Panel value="instance-settings" pt="xs">
                    <Settings />
                </Tabs.Panel>
                <Tabs.Panel value="account-settings" pt="xs">
                    <Account />
                </Tabs.Panel>
                <Tabs.Panel value="users" pt="xs">
                    <Users />
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
};

export default HomeAccount;
