import React from 'react';
import { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { Button, Container, TextInput, Stack, Title, Text, PasswordInput } from '@mantine/core';
import { IconLock, IconUser, IconLogin, IconAt } from '@tabler/icons';

import Success from '../../components/info/success';

import { signUp } from '../../api/authentication';

import { setToken } from '../../helpers/token';

const Secret = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [token, setTokenState] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (token) {
            setToken(token);
        }
    }, [token]);

    const onUsernameChange = (event) => {
        setUsername(event.target.value);
    };

    const onPasswordChange = (event) => {
        setPassword(event.target.value);
    };

    const onEmailChange = (event) => {
        setEmail(event.target.value);
    };

    const onSignUp = async (event) => {
        event.preventDefault();

        const data = await signUp(email, username, password);

        if (data.error) {
            setError(data.error);
            setSuccess(false);

            return;
        }

        setTokenState(data.token);
        setError(null);
        setSuccess(true);
    };

    return (
        <Container size="xs">
            <Stack>
                <Title order={1} align="center">
                    Sign up
                </Title>

                <Text size="sm" align="center">
                    Everything you need to access, and manage the Hemmelig secrets.
                </Text>

                <TextInput
                    icon={<IconAt />}
                    placeholder="Email"
                    value={email}
                    onChange={onEmailChange}
                    required
                    error={error}
                />

                <TextInput
                    icon={<IconUser />}
                    placeholder="Username"
                    value={username}
                    onChange={onUsernameChange}
                    required
                    error={error}
                />

                <PasswordInput
                    icon={<IconLock />}
                    placeholder="Your password"
                    value={password}
                    onChange={onPasswordChange}
                    required
                    error={error}
                />

                <Button
                    styles={() => ({
                        root: {
                            backgroundColor: 'var(--color-contrast)',

                            '&:hover': {
                                backgroundColor: 'var(--color-contrast)',
                                filter: 'brightness(115%)',
                            },
                        },
                    })}
                    leftIcon={<IconLogin size={14} />}
                    onClick={onSignUp}
                >
                    Sign up
                </Button>
            </Stack>

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
