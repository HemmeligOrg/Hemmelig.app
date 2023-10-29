import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
    Stack,
    Button,
    Group,
    TextInput,
    Text,
    PasswordInput,
    Container,
    Loader,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { openConfirmModal } from '@mantine/modals';
import { IconAt, IconLock, IconEdit, IconTrash } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import ErrorBox from '../../components/error-box';
import SuccessBox from '../../components/success-box';

import style from './account.module.css';

import { getUser, updateUser, deleteUser } from '../../api/account';

const Account = () => {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userError, setUserError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [deleted, setDeleted] = useState(false);

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
                const userInfo = await getUser();

                if (userInfo.error || [401, 500].includes(userInfo.statusCode)) {
                    setUserError(userInfo.error ? userInfo.error : 'Not logged in');

                    return;
                }

                form.setValues(userInfo.user);

                setIsLoading(false);
                setUserError(null);
            } catch (err) {
                setUserError(err);
            }
        })();
    }, []);

    const onProfileUpdate = async (e) => {
        e.preventDefault();

        const values = form.values;

        try {
            const updatedUserInfo = await updateUser(values);

            if (updatedUserInfo.error || [401, 500].includes(updatedUserInfo.statusCode)) {
                setError(
                    updatedUserInfo.error
                        ? updatedUserInfo.error
                        : 'Could not update your user profile'
                );

                return;
            }

            const { user, error, type } = updatedUserInfo;

            if (error) {
                if (type === 'no-data') {
                    form.setErrors({ email: error });
                } else {
                    form.setErrors({ [type]: error });
                }
            } else {
                form.setValues({ email: user.email });
            }

            setError(null);
            setSuccessMessage('settings.updated');
            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
                setSuccessMessage(null);
            }, 2500);
        } catch (err) {
            setError(err);
        }
    };

    const onDeleteUser = async (e) => {
        try {
            const deletedUserInfo = await deleteUser();

            if (deletedUserInfo.error || [401, 500].includes(deletedUserInfo.statusCode)) {
                setError(
                    deletedUserInfo.error ? deletedUserInfo.error : 'Could not delete the user'
                );

                return;
            }

            setError(null);
            setSuccessMessage('settings.deleted');
            setSuccess(true);

            setTimeout(() => {
                setDeleted(true);
            }, 1000);
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

    if (deleted) {
        return <Navigate to="/signout" />;
    }

    if (isLoading && !userError) {
        return (
            <Container>
                <Loader color="teal" variant="bars" />
            </Container>
        );
    }

    if (userError) {
        return (
            <Stack>
                <ErrorBox message={userError} />
            </Stack>
        );
    }

    return (
        <Stack align="flex-start">
            {error && <ErrorBox message={error} className={style.width} />}
            {success && <SuccessBox message={successMessage} className={style.width} />}

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
