import React from 'react';
import { useEffect, useState } from 'react';
import { Container, TextInput, Stack, Title, Text, Anchor } from '@mantine/core';
import { IconUser, IconKey } from '@tabler/icons';
import { Link, Redirect } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { getToken, hasToken } from '../../helpers/token';
import { userLoginChanged } from '../../actions';

import Spinner from '../../components/spinner';
import Error from '../../components/info/error';

import { getUser } from '../../api/account';

const Account = () => {
    const [token] = useState(hasToken() ? getToken() : '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [user, setUser] = useState({});

    const dispatch = useDispatch();

    useEffect(() => {
        if (!token) {
            return;
        }

        (async () => {
            try {
                setLoading(true);
                const response = await getUser(token);

                if (response.statusCode === 401 || response.statusCode === 500) {
                    setError('Not logged in');

                    return;
                }

                dispatch(userLoginChanged(true));
                setLoading(false);

                const { user } = response;
                setUser(user);
                setError(null);
            } catch (e) {
                setError(e);
            }
        })();
    }, [token, dispatch]);

    if (error) {
        return <Error>{error}</Error>;
    }

    if (!token) {
        return <Redirect to="/signin" />;
    }

    if (loading) {
        return <Spinner />;
    }

    return (
        <Container>
            <Stack>
                <Title order={1}>Account</Title>
                <Text size="sm">
                    Hi, <strong>{user.username}</strong>
                </Text>
                <Text size="sm">
                    We are glad you logged in. Now you earned the right to upload images that will
                    be encryptet to be shared with anyone!
                </Text>

                <Title order={4}>
                    <strong>BASIC AUTH</strong>
                </Title>

                <TextInput
                    label="User"
                    icon={<IconUser />}
                    placeholder="Username"
                    value={user.username}
                    readOnly
                />

                <TextInput
                    label="Token"
                    icon={<IconKey />}
                    placeholder="Token"
                    value={user.basicAuthToken}
                    readOnly
                />

                <Text size="sm">
                    For information about how to use the API, please have a look at the{' '}
                    <Anchor component={Link} to="/api-docs">
                        API documentation
                    </Anchor>
                    .
                </Text>
            </Stack>
        </Container>
    );
};

export default Account;
