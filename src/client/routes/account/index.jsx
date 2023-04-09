import React, { useEffect, useState } from 'react';
import {
    Container,
    TextInput,
    PasswordInput,
    Stack,
    Text,
    Button,
    Group,
    Tabs,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { openConfirmModal } from '@mantine/modals';
import { useMediaQuery } from '@mantine/hooks';
import { IconUser, IconAt, IconLock, IconTrash, IconSettings, IconEdit } from '@tabler/icons';
import { Redirect } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { userLoginChanged } from '../../actions';

import Settings from './settings';

import Spinner from '../../components/spinner';
import ErrorComponent from '../../components/info/error';

import { getUser, updateUser, deleteUser } from '../../api/account';

import { useTranslation } from 'react-i18next';

const Account = () => {
    const { t } = useTranslation();

    const username = useSelector((state) => state.username);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [user, setUser] = useState({});
    const [activeTab, setActiveTab] = useState('account');

    const isMobile = useMediaQuery('(max-width: 915px)');

    const dispatch = useDispatch();

    const form = useForm({
        initialValues: {
            currentPassword: '',
            newPassword: '',
            email: '',
            confirmNewPassword: '',
        },
        validate: {
            confirmNewPassword: (value, values) =>
                value !== values.newPassword ? 'Passwords did not match' : null,
        },
    });

    useEffect(() => {
        if (!username) {
            return;
        }

        (async () => {
            try {
                setLoading(true);
                const response = await getUser();

                if (response.statusCode === 401 || response.statusCode === 500) {
                    setError('Not logged in');

                    return;
                }

                dispatch(userLoginChanged(true));
                setLoading(false);

                const { user } = response;

                setUser(user);

                form.setValues({ email: user.email });

                setError(null);
            } catch (e) {
                setError(e);
            }
        })();

        // eslint-disable-next-line
    }, [username, dispatch]);

    if (error) {
        return <ErrorComponent>{error.error}</ErrorComponent>;
    }

    if (!username) {
        return <Redirect to="/signin" />;
    }

    if (loading) {
        return <Spinner />;
    }

    const onDeleteUser = async () => {
        try {
            const response = await deleteUser();

            if (response.statusCode === 401 || response.statusCode === 500) {
                setError('Could not delete the user');

                return;
            }
        } catch (e) {
            setError(e);
        }
    };

    const onProfileUpdate = async (e) => {
        e.preventDefault();

        setActiveTab('settings');

        const values = form.values;

        try {
            setLoading(true);

            const response = await updateUser(values);

            setLoading(false);

            if (response.statusCode === 401 || response.statusCode === 500) {
                setError(response.error ? response.error : 'Could not update your user profile');

                return;
            }

            const { user, error, type } = response;

            if (error) {
                if (type === 'no-data') {
                    form.setErrors({ email: error });
                } else {
                    form.setErrors({ [type]: error });
                }
            } else {
                setUser(user);

                form.setValues({ email: user.email });
            }
        } catch (e) {
            setError(e);
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
            <Tabs
                color="orange"
                orientation={isMobile ? 'horisontal' : 'vertical'}
                defaultValue={activeTab}
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
                    <Container size="xs">
                        <Stack>
                            <TextInput
                                label="Email"
                                icon={<IconAt size={14} />}
                                placeholder="Email"
                                {...form.getInputProps('email')}
                            />

                            <PasswordInput
                                label="Current password"
                                icon={<IconLock size={14} />}
                                placeholder="Your current password"
                                {...form.getInputProps('currentPassword')}
                            />

                            <PasswordInput
                                label="New password"
                                icon={<IconLock size={14} />}
                                placeholder="Update your password"
                                {...form.getInputProps('newPassword')}
                            />

                            <PasswordInput
                                label="Confirm Password"
                                icon={<IconLock size={14} />}
                                placeholder="Confirm your new password"
                                {...form.getInputProps('confirmNewPassword')}
                            />

                            <Group position="right">
                                <Button
                                    leftIcon={<IconEdit size={14} />}
                                    onClick={onProfileUpdate}
                                    color="hemmelig"
                                >
                                    Update details
                                </Button>
                            </Group>
                        </Stack>
                    </Container>
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
};

export default Account;
