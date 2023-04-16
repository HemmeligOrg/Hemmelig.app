import { useEffect, useState, lazy } from 'react';
import { Alert, Container, Loader, Text, Button, Group, Tabs } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconUser, IconSettings, IconAlertCircle, IconLock } from '@tabler/icons';
import { Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { getUser } from '../../api/account';

const Settings = lazy(() => import('./settings'));
const Account = lazy(() => import('./account'));
const Users = lazy(() => import('./users'));
const Secrets = lazy(() => import('./secrets'));

import { useTranslation } from 'react-i18next';

const HomeAccount = () => {
    const { t } = useTranslation();

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
        return <Redirect push to="/signin" />;
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
                defaultValue="account"
                keepMounted={false}
            >
                <Tabs.List grow>
                    <Tabs.Tab value="account" icon={<IconUser size={14} />}>
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

                <Tabs.Panel value="account" pt="xs">
                    <Container>
                        <Text size="sm">
                            Hi, <strong>{user.username}</strong>
                        </Text>

                        <Text size="sm">
                            We are glad you logged in. Here is the list of features signed in users
                            get:
                            <ul>
                                <li>Upload files</li>
                                <li>Expiration time of 14 and 28 days for secrets</li>
                                <li>List and delete your secrets</li>
                            </ul>
                            More features are coming! Thanks for joining Hemmelig.app!
                            <span role="img" aria-label="celebration icon">
                                🎉 🎉 🎉 🎉
                            </span>
                        </Text>
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
