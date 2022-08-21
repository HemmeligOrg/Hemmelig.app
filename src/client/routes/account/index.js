import React from 'react';
import { useEffect, useState } from 'react';
import { Container, TextInput, Stack, Title, Text, Anchor, Button, Group } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
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

    const openDeleteModal = () =>
        openConfirmModal({
            title: 'Delete your profile',
            centered: true,
            children: (
                <Text size="sm">
                    Are you sure you want to delete your profile? This action is destructive and you
                    will have to contact support to restore your data.
                </Text>
            ),
            labels: { confirm: 'Delete account', cancel: "No don't delete it" },
            confirmProps: { color: 'red' },
            onConfirm: () => onDeleteUser(),
        });

    return (
        <Container>
            <Stack>
                <Title order={1}>Account</Title>
                <Text size="sm">
                    Hi, <strong>{user.username}</strong>
                </Text>

                <Text size="sm">
                    We are glad you logged in. Here is the list of features signed in users get:
                    <ul>
                        <li>Upload files</li>
                        <li>Set secrets that never expires</li>
                    </ul>
                    More features are coming! Thanks for joining Hemmelig.app!
                    <span role="img" aria-label="celebration icon">
                        🎉 🎉 🎉 🎉
                    </span>
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
                    If you do not feel to be part of the Hemmelig.app journey anymore. Feel free to
                    delete your profile. Hemmelig will remove all the information connected to your
                    account!
                </Text>

                <Group position="right">
                    <Button
                        variant="gradient"
                        gradient={{ from: 'orange', to: 'red' }}
                        onClick={openDeleteModal}
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
