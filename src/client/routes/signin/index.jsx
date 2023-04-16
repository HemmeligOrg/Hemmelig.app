import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
    Alert,
    Button,
    Container,
    TextInput,
    Stack,
    Title,
    Text,
    PasswordInput,
    Notification,
} from '@mantine/core';
import { useDispatch } from 'react-redux';
import { useForm } from '@mantine/form';
import { IconLock, IconUser, IconLogin, IconAlertCircle, IconCheck } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

import { signIn } from '../../api/authentication';
import { userLogin } from '../../actions';

const SignIn = () => {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const dispatch = useDispatch();

    const { t } = useTranslation();

    const form = useForm({
        initialValues: {
            username: '',
            password: '',
        },
    });

    const onSignIn = async (values) => {
        const data = await signIn(values.username, values.password);

        if (data.statusCode === 401) {
            form.setErrors({
                username: 'Wrong username or password. Please try again.',
                password: 'Wrong username or password. Please try again.',
            });

            setSuccess(false);

            return;
        }

        if (data.statusCode === 403) {
            setError(data.error);

            setSuccess(false);

            return;
        }

        dispatch(userLogin(data));
        form.clearErrors();
        setSuccess(true);
    };

    return (
        <Container size="xs">
            <form onSubmit={form.onSubmit((values) => onSignIn(values))}>
                <Stack>
                    <Title order={1} align="center">
                        Sign in
                    </Title>

                    <Text size="sm" align="center">
                        Everything you need to access, and manage the Hemmelig secrets.
                    </Text>

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

                    <TextInput
                        icon={<IconUser size={14} />}
                        placeholder="Username"
                        required
                        {...form.getInputProps('username')}
                    />

                    <PasswordInput
                        icon={<IconLock size={14} />}
                        placeholder="Your password"
                        required
                        {...form.getInputProps('password')}
                    />

                    <Button color="hemmelig" leftIcon={<IconLogin size={14} />} type="submit">
                        Sign in
                    </Button>
                </Stack>
            </form>

            {success && (
                <Notification
                    icon={<IconCheck size="1.1rem" />}
                    color="teal"
                    title={t('settings.success')}
                    withCloseButton={false}
                >
                    Redirecting to your account page. <Navigate replace to="/account" />
                </Notification>
            )}
        </Container>
    );
};

export default SignIn;
