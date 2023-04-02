import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { Button, Container, TextInput, Stack, Title, Text, PasswordInput } from '@mantine/core';
import { useDispatch } from 'react-redux';
import { useForm } from '@mantine/form';
import { IconLock, IconUser, IconLogin } from '@tabler/icons';

import Success from '../../components/info/success';
import { signIn } from '../../api/authentication';
import { userLogin } from '../../actions';

import config from '../../config';

const SignIn = () => {
    const [success, setSuccess] = useState(false);

    const dispatch = useDispatch();

    const form = useForm({
        initialValues: {
            username: '',
            password: '',
        },
    });

    const userDisabled = config.get('settings.disableUsers');

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

        dispatch(userLogin(data));
        form.clearErrors();
        setSuccess(true);
    };

    return (
        <Container size="xs">
            <form onSubmit={form.onSubmit((values) => onSignIn(values))}>
                <Stack>
                    <Title order={1} align="center">
                        {userDisabled ? 'User creation has been disabled' : 'Sign in'}
                    </Title>

                    <Text size="sm" align="center">
                        Everything you need to access, and manage the Hemmelig secrets.
                    </Text>
                    <TextInput
                        icon={<IconUser size={14} />}
                        placeholder="Username"
                        required
                        disabled={userDisabled}
                        {...form.getInputProps('username')}
                    />

                    <PasswordInput
                        icon={<IconLock size={14} />}
                        placeholder="Your password"
                        required
                        disabled={userDisabled}
                        {...form.getInputProps('password')}
                    />

                    <Button
                        color="hemmelig"
                        leftIcon={<IconLogin size={14} />}
                        type="submit"
                        disabled={userDisabled}
                    >
                        Sign in
                    </Button>
                </Stack>
            </form>

            {success && (
                <Success>
                    Redirecting to your account page. <Redirect to="/account" />
                </Success>
            )}
        </Container>
    );
};

export default SignIn;
