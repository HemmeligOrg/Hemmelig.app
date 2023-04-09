import React, { useEffect, useState } from 'react';
import {
    Alert,
    Container,
    Stack,
    Button,
    Group,
    Notification,
    TextInput,
    PasswordInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAt, IconLock, IconEdit, IconAlertCircle, IconCheck } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

import { getUser, updateUser } from '../../api/account';

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

    return (
        <Container size="xs">
            <Stack>
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
                {success && (
                    <Notification
                        icon={<IconCheck size="1.1rem" />}
                        color="teal"
                        title={t('settings.success')}
                        withCloseButton={false}
                    >
                        {t('settings.updated')}
                    </Notification>
                )}

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
    );
};

export default Account;
