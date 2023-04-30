import { useEffect, useState } from 'react';
import {
    Alert,
    Stack,
    Button,
    Group,
    Notification,
    TextInput,
    Text,
    PasswordInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { openConfirmModal } from '@mantine/modals';
import { IconAt, IconLock, IconEdit, IconAlertCircle, IconCheck, IconTrash } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

import style from './account.module.css';

import { getUser, updateUser, deleteUser } from '../../api/account';

const Account = () => {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const { t } = useTranslation();

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
        (async () => {
            try {
                const response = await getUser();

                if (response.statusCode === 401 || response.statusCode === 500) {
                    setError('Not logged in');

                    return;
                }

                form.setValues(response.user);

                setError(null);
            } catch (e) {
                setError(e);
            }
        })();
    }, []);

    const onProfileUpdate = async (e) => {
        e.preventDefault();

        const values = form.values;

        try {
            const response = await updateUser(values);

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
                form.setValues({ email: user.email });
            }

            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
            }, 3500);
        } catch (e) {
            setError(e);
        }
    };

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
        <Stack align="flex-start">
            {error && (
                <Alert
                    icon={<IconAlertCircle size="1rem" />}
                    title={t('home.bummer')}
                    color="red"
                    variant="outline"
                    className={style.width}
                >
                    {error}
                </Alert>
            )}
            {success && (
                <Notification
                    icon={<IconCheck size="1.1rem" />}
                    color="teal"
                    title={t('settings.success')}
                    withCloseButton={false}
                    className={style.width}
                >
                    {t('settings.updated')}
                </Notification>
            )}

            <Group position="right" grow>
                <Stack className={style.width}>
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
                </Stack>
            </Group>

            <Group position="right" grow>
                <Button
                    variant="gradient"
                    gradient={{ from: 'orange', to: 'red' }}
                    onClick={openDeleteModal}
                    leftIcon={<IconTrash size={14} />}
                >
                    Delete profile
                </Button>

                <Button
                    leftIcon={<IconEdit size={14} />}
                    onClick={onProfileUpdate}
                    color="hemmelig"
                >
                    Update details
                </Button>
            </Group>
        </Stack>
    );
};

export default Account;
