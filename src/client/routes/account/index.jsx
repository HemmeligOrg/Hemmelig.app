import React, { useEffect, useState } from 'react';
import { Alert, Container, Loader, Text, Button, Group, Tabs } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { useMediaQuery } from '@mantine/hooks';
import { IconUser, IconTrash, IconSettings, IconAlertCircle } from '@tabler/icons';
import { Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { getUser, deleteUser } from '../../api/account';

import Settings from './settings';
import Account from './account';
import Users from './users';

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

    const onDeleteUser = async () => {
        try {
            const response = await deleteUser();

            if (response.statusCode === 401 || response.statusCode === 500) {
                setError('Could not delete the user');

                return;
            }
        } catch (err) {
            setError(err);
        }
    };

    const openDeleteModal = () =>
        openConfirmModal({
            title: 'Delete your profile',
            centered: true,
            children: <Text size="sm">Are you sure you want to delete your profile?</Text>,
            labels: { confirm: 'Delete account', cancel: "No don't delete it" },
            confirmProps: { color: 'red' },
            onConfirm: () => onDeleteUser(),
        });

    return (
        <Container>
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
            >
                <Tabs.List>
                    <Tabs.Tab value="account" icon={<IconUser size={14} />}>
                        {t('account')}
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
                                <li>Expire time of 14 and 28 days for secrets</li>
                            </ul>
                            More features are coming! Thanks for joining Hemmelig.app!
                            <span role="img" aria-label="celebration icon">
                                🎉 🎉 🎉 🎉
                            </span>
                        </Text>

                        <Text size="sm">
                            If you do not feel to be part of the Hemmelig.app journey anymore. Feel
                            free to delete your profile. Hemmelig will remove all the information
                            connected to your account!
                        </Text>

                        <Group position="right">
                            <Button
                                variant="gradient"
                                gradient={{ from: 'orange', to: 'red' }}
                                onClick={openDeleteModal}
                                leftIcon={<IconTrash size={14} />}
                            >
                                Delete profile
                            </Button>
                        </Group>
                    </Container>
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
