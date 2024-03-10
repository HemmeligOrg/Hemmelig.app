import { Button, Group, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { openConfirmModal } from '@mantine/modals';
import { IconAt, IconEdit, IconLock, IconTrash } from '@tabler/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLoaderData } from 'react-router-dom';
import ErrorBox from '../../components/error-box';
import SuccessBox from '../../components/success-box';

import style from './account.module.css';

import { deleteUser, updateUser } from '../../api/account';

const Account = () => {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [deleted, setDeleted] = useState(false);

    const { t } = useTranslation();

    const userInfo = useLoaderData();

    const form = useForm({
        initialValues: userInfo?.user,
        validate: {
            confirmNewPassword: (value, values) =>
                value !== values.newPassword ? t('account.account.passwords_does_not_match') : null,
        },
    });

    const onProfileUpdate = async (e) => {
        e.preventDefault();

        const values = form.values;

        try {
            const updatedUserInfo = await updateUser(values);

            if (updatedUserInfo.error || [400, 401, 500].includes(updatedUserInfo.statusCode)) {
                setError(
                    updatedUserInfo.message
                        ? updatedUserInfo.message
                        : t('account.account.can_not_update_profile')
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
                    deletedUserInfo.error
                        ? deletedUserInfo.error
                        : t('account.account.can_not_delete')
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
            title: t('account.accounts.delete_account'),
            centered: true,
            children: <Text size="sm">{t('account.account.do_you_want_delete')}</Text>,
            labels: {
                confirm: t('account.account.delete_account'),
                cancel: t('account.account.dont_delete_account'),
            },
            confirmProps: { color: 'red' },
            onConfirm: () => onDeleteUser(),
        });

    if (deleted) {
        return <Navigate to="/signout" />;
    }

    if (userInfo.error || [401, 500].includes(userInfo.statusCode)) {
        const userError = userInfo.error ? userInfo.error : t('not_logged_in');

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
                        label={t('account.account.email')}
                        icon={<IconAt size={14} />}
                        placeholder={t('account.account.email')}
                        {...form.getInputProps('email')}
                    />

                    <PasswordInput
                        label={t('account.account.your_password')}
                        icon={<IconLock size={14} />}
                        placeholder={t('account.account.current_password')}
                        {...form.getInputProps('currentPassword')}
                    />

                    <PasswordInput
                        label={t('account.account.new_password')}
                        icon={<IconLock size={14} />}
                        placeholder={t('account.account.update_your_password')}
                        {...form.getInputProps('newPassword')}
                    />

                    <PasswordInput
                        label={t('account.account.confirm_password')}
                        icon={<IconLock size={14} />}
                        placeholder={t('account.account.confirm_new_password')}
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
                    {t('account.account.delete_account')}
                </Button>

                <Button
                    leftIcon={<IconEdit size={14} />}
                    onClick={onProfileUpdate}
                    color="hemmelig"
                >
                    {t('account.account.update_details')}
                </Button>
            </Group>
        </Stack>
    );
};

export default Account;
