import React from 'react';
import { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { Button, Container, TextInput, Stack, Title, Text, PasswordInput } from '@mantine/core';
import { IconLock, IconUser, IconLogin } from '@tabler/icons';

import Success from '../../components/info/success';
import { signIn } from '../../api/authentication';
import { setToken } from '../../helpers/token';
import config from '../../config';

const Secret = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [token, setTokenState] = useState('');
    const [success, setSuccess] = useState(false);

    const userDisabled = config.get('settings.disableUsers');

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

    const onSignIn = async (event) => {
        event.preventDefault();

        const data = await signIn(username, password);

        if (data.statusCode === 401) {
            setError('Wrong username or password. Please try again.');
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
                    {userDisabled ? 'User creation has been disabled' : 'Sign in'}
                </Title>

                <Text size="sm" align="center">
                    Everything you need to access, and manage the Hemmelig secrets.
                </Text>

                <TextInput
                    icon={<IconUser size={14} />}
                    placeholder="Username"
                    value={username}
                    onChange={onUsernameChange}
                    required
                    error={error}
                    disabled={userDisabled}
                />

                <PasswordInput
                    icon={<IconLock size={14} />}
                    placeholder="Your password"
                    value={password}
                    onChange={onPasswordChange}
                    required
                    error={error}
                    disabled={userDisabled}
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
                    onClick={onSignIn}
                    disabled={userDisabled}
                >
                    Sign in
                </Button>
            </Stack>

            {success && (
                <Success>
                    Redirecting to your account page. <Redirect to="/account" />
                </Success>
            )}
        </Container>
    );
};

export default Secret;
