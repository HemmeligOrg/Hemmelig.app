import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import {
    Alert,
    Button,
    Container,
    TextInput,
    Stack,
    Title,
    Text,
    PasswordInput,
} from '@mantine/core';
import { useDispatch } from 'react-redux';
import { useForm } from '@mantine/form';
import { IconLock, IconUser, IconLogin, IconAt, IconAlertCircle } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

import Success from '../../components/info/success';
import { signUp } from '../../api/authentication';
import { userLogin } from '../../actions';

const SignUp = () => {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const dispatch = useDispatch();

    const { t } = useTranslation();

    const form = useForm({
        initialValues: {
            username: '',
            password: '',
            email: '',
        },
    });

    const onSignUp = async (values) => {
        const data = await signUp(values.email, values.username, values.password);

        if (data.statusCode === 403) {
            setError(data.error);

            setSuccess(false);

            return;
        }

        if (data.error) {
            form.setErrors({
                username: data.type == 'username' ? data.error : '',
                password: data.type == 'password' ? data.error : '',
                email: data.type == 'email' ? data.error : '',
            });

            setSuccess(false);

            return;
        }

        dispatch(userLogin(data));
        form.clearErrors();
        setSuccess(true);
    };

    return (
        <Container size="xs">
            <form onSubmit={form.onSubmit((values) => onSignUp(values))}>
                <Stack>
                    <Title order={1} align="center">
                        Sign up
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
                        icon={<IconAt size={14} />}
                        placeholder="Email"
                        required
                        {...form.getInputProps('email')}
                    />

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
                        Sign up
                    </Button>
                </Stack>
            </form>

            {success && (
                <Success>
                    Redirecting to your account page.
                    <Redirect to="/account" />
                </Success>
            )}
        </Container>
    );
};

export default SignUp;
