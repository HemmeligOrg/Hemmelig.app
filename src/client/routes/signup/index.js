import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { Button, Container, TextInput, Stack, Title, Text, PasswordInput } from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from '@mantine/form';
import { IconLock, IconUser, IconLogin, IconAt } from '@tabler/icons';

import Success from '../../components/info/success';
import { signUp } from '../../api/authentication';
import { setToken } from '../../helpers/token';
import config from '../../config';

const Secret = () => {
    const [success, setSuccess] = useState(false);

    const dispatch = useDispatch();
    const token = useSelector((state) => state.token);

    const form = useForm({
        initialValues: {
            username: '',
            password: '',
            email: '',
        },
    });

    const userDisabled = config.get('settings.disableUsers');

    useEffect(() => {
        if (token) {
            setToken(token);
        }
    }, [token]);

    const onSignUp = async (values) => {
        const data = await signUp(values.email, values.username, values.password);

        if (data.error) {
            form.setErrors({
                username: data.type == 'username' ? data.error : '',
                password: data.type == 'password' ? data.error : '',
                email: data.type == 'email' ? data.error : '',
            });
            setSuccess(false);

            return;
        }

        dispatch(userLogin(data.token));
        form.clearErrors();
        setSuccess(true);
    };

    return (
        <Container size="xs">
            <form onSubmit={form.onSubmit((values) => onSignUp(values))}>
                <Stack>
                    <Title order={1} align="center">
                        {userDisabled ? 'User creation has been disabled' : 'Sign up'}
                    </Title>

                    <Text size="sm" align="center">
                        Everything you need to access, and manage the Hemmelig secrets.
                    </Text>

                    <TextInput
                        icon={<IconAt size={14} />}
                        placeholder="Email"
                        required
                        disabled={userDisabled}
                        {...form.getInputProps('email')}
                    />

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

export default Secret;
