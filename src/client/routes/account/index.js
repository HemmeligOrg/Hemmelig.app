import React from 'react';
import { useEffect, useState } from 'react';
import { Container, TextInput, Stack, Title, Text, Anchor, Button, Group } from '@mantine/core';
import { IconUser, IconKey, IconTrash } from '@tabler/icons';
import { Link, Redirect } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { getToken, hasToken, removeToken } from '../../helpers/token';
import { userLoginChanged } from '../../actions';

import Spinner from '../../components/spinner';
import Error from '../../components/info/error';

import { getUser, deleteUser } from '../../api/account';

const Account = () => {
    const [token, setToken] = useState(hasToken() ? getToken() : '');
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

    const onDeleteUser = async () => {
        try {
            const response = await deleteUser(token);

            if (response.statusCode === 401 || response.statusCode === 500) {
                setError('Could not delete the user');

                return;
            }
        } catch (e) {
            setError(e);
        }

        removeToken();

        setToken('');
    };

    return (
        <Container>
            <Stack>
                <Title order={1}>Account</Title>
                <Text size="sm">
                    Hi, <strong>{user.username}</strong>
                </Text>
                <Text size="sm">
                    We are glad you logged in. Currently, there is nothing here for you... BUT, we
                    plan to add features for signed in users going forward. This just shows us you
                    are intrested. Thanks 🎉
                </Text>

                <Text size="sm">
                    Since there are still no use case for this sign in, feel free to delete your
                    account. Hemmelig.app actually deletes your account with all the information.
                    This can be verified by looking at our github codebase.
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

                <Group position="right">
                    <Button
                        variant="gradient"
                        gradient={{ from: 'orange', to: 'red' }}
                        onClick={onDeleteUser}
                        leftIcon={<IconTrash size={14} />}
                    >
                        Delete profile
                    </Button>
                </Group>
            </Stack>
        </Container>
    );
};

export default Account;
