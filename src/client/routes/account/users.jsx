import React, { useEffect, useState } from 'react';
import {
    ActionIcon,
    Container,
    Center,
    Text,
    Stack,
    Select,
    Button,
    Group,
    TextInput,
    PasswordInput,
    Table,
    Modal,
    Loader,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { openConfirmModal } from '@mantine/modals';
import { IconEdit, IconAt, IconUser, IconChefHat, IconPlus, IconTrash } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

import { getUsers, updateUser, addUser, deleteUser } from '../../api/users';
import ErrorBox from '../../components/error-box';
import SuccessBox from '../../components/success-box';

const SKIP = 10;

const updateUserList = (users, form, action = 'update') => {
    return users.reduce((acc, current) => {
        if (action === 'update' && current.username === form.values.username) {
            acc.push(form.values);
        } else if (action === 'delete' && current.username === form.values.username) {
            // Skip
        } else {
            acc.push(current);
        }

        return acc;
    }, []);
};

const addUserList = (users, data) => {
    const updated = [...users];

    const [user] = data;

    updated.push(user);

    return updated;
};

const Users = () => {
    const [modalState, setModalState] = useState('add');
    const [users, setUsers] = useState([]);
    const [skip, setSkip] = useState(SKIP);
    const [showMore, setShowMore] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [opened, { open, close }] = useDisclosure(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userError, setUserError] = useState(null);

    const { t } = useTranslation();

    const defaultValues = {
        username: '',
        email: '',
        role: '',
        password: '',
    };

    const form = useForm({
        initialValues: defaultValues,
    });

    useEffect(() => {
        (async () => {
            try {
                const users = await getUsers();

                if (users.error || [401, 403, 500].includes(users.statusCode)) {
                    setUserError(users.error ? users.error : 'Not logged in');

                    return;
                }

                if (users?.length < SKIP) {
                    setShowMore(false);
                }

                if (!users?.error) {
                    setUsers(users);
                }

                setIsLoading(false);
                setUserError(null);
            } catch (err) {
                setUserError(err);
            }
        })();
    }, []);

    const onUpdateUser = async (event) => {
        event.preventDefault();

        try {
            const updatedUserInfo = await updateUser(form.values);

            if (
                updatedUserInfo.error ||
                [401, 403, 409, 500].includes(updatedUserInfo.statusCode)
            ) {
                setError(updatedUserInfo.error ? updatedUserInfo.error : 'Sonething went wrong!');

                return;
            }

            setError(null);
            setSuccess(true);

            setUsers(updateUserList(users, form, 'update'));

            setTimeout(() => {
                setSuccess(false);
            }, 2500);
        } catch (err) {
            setError(err);
        }
    };

    const onAddUser = async (event) => {
        event.preventDefault();

        try {
            const addedUserInfo = await addUser(form.values);

            if (addedUserInfo.error || [401, 403, 409, 500].includes(addedUserInfo.statusCode)) {
                setError(addedUserInfo.error ? addedUserInfo.error : 'Something went wrong!');

                return;
            }

            setError(null);
            setSuccess(true);

            setUsers(addUserList(users, addedUserInfo));

            setTimeout(() => {
                setSuccess(false);
            }, 2500);
        } catch (err) {
            setError(err);
        }
    };

    const onDeleteUser = async (user) => {
        try {
            const deletedUserInfo = await deleteUser(user);

            if (
                deletedUserInfo.error ||
                [401, 403, 409, 500].includes(deletedUserInfo.statusCode)
            ) {
                setError(deletedUserInfo.error ? deletedUserInfo.error : 'Something went wrong!');

                return;
            }

            setError(null);
            setSuccess(true);

            setUsers(updateUserList(users, { values: user }, 'delete'));

            setTimeout(() => {
                setSuccess(false);
            }, 2500);
        } catch (err) {
            setError(err);
        }
    };

    const onLoadUsers = async (event) => {
        event.preventDefault();

        try {
            const moreUsers = await getUsers(skip);

            if (moreUsers.error || [401, 403, 409, 500].includes(moreUsers.statusCode)) {
                setError(moreUsers.error ? moreUsers.error : 'Something went wrong!');

                return;
            }

            setError(null);

            if (moreUsers?.length < SKIP) {
                setShowMore(false);
            }

            setSkip(skip + SKIP);

            setUsers([...users, ...moreUsers]);
        } catch (err) {
            setError(err);
        }
    };

    const openDeleteModal = (user) => {
        setSuccess(false);
        openConfirmModal({
            title: 'Delete ' + user.username,
            centered: true,
            children: <Text size="sm">Are you sure you want to delete this user?</Text>,
            labels: { confirm: 'Delete user', cancel: "No don't delete it" },
            confirmProps: { color: 'red' },
            onConfirm: () => onDeleteUser(user),
        });
    };

    const onModalClose = (event) => {
        form.setValues(defaultValues);
        setSuccess(false);
        close(event);
    };

    const rows = users.map((user) => (
        <tr key={user.username}>
            <td>{user.username}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>
                <ActionIcon
                    variant="filled"
                    onClick={(event) => {
                        open(event);
                        form.setValues(user);
                        setModalState('update');
                    }}
                >
                    <IconEdit size="1rem" />
                </ActionIcon>
            </td>
            <td>
                <ActionIcon variant="filled" onClick={() => openDeleteModal(user)}>
                    <IconTrash size="1rem" />
                </ActionIcon>
            </td>
        </tr>
    ));

    if (isLoading && !userError) {
        return (
            <Container>
                <Loader color="teal" variant="bars" />
            </Container>
        );
    }

    if (userError) {
        return (
            <Stack>
                <ErrorBox message={userError} />
            </Stack>
        );
    }

    if (!users.length) {
        return (
            <Container size="xs ">
                <ErrorBox message={'You have to be an admin to view the users'} />
            </Container>
        );
    }

    return (
        <Stack>
            <Modal opened={opened} onClose={onModalClose} title={t('users.edit')}>
                {error && <ErrorBox message={error} />}
                {success && <SuccessBox message={'users.saved'} />}
                <Stack>
                    <TextInput
                        label="Username"
                        icon={<IconUser size={14} />}
                        placeholder="Username"
                        disabled={modalState === 'update'}
                        {...form.getInputProps('username')}
                    />
                    <TextInput
                        label="Email"
                        icon={<IconAt size={14} />}
                        placeholder="Email"
                        {...form.getInputProps('email')}
                    />
                    {modalState === 'add' && (
                        <PasswordInput
                            label="Password"
                            icon={<IconAt size={14} />}
                            placeholder="Password"
                            {...form.getInputProps('password')}
                        />
                    )}
                    <Select
                        label="Role"
                        placeholder="Role"
                        icon={<IconChefHat size={14} />}
                        value={form.getInputProps('role').value}
                        onChange={(value) => form.setFieldValue('role', value)}
                        data={[
                            { value: 'admin', label: 'Admin' },
                            { value: 'creator', label: 'Creator' },
                            { value: 'user', label: 'User' },
                        ]}
                    />
                </Stack>

                <Group position="right" mt="xl">
                    <Button
                        leftIcon={<IconEdit size={14} />}
                        onClick={modalState === 'add' ? onAddUser : onUpdateUser}
                        color="hemmelig"
                        disabled={success}
                    >
                        {t('users.save')}
                    </Button>
                </Group>
            </Modal>

            {error && <ErrorBox message={error} />}
            {success && !opened && <SuccessBox message={'users.deleted'} />}

            <Group position="left">
                <Table horizontalSpacing="sm" highlightOnHover>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Edit</th>
                            <th>Delete</th>
                        </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </Table>
            </Group>

            {showMore && (
                <Center>
                    <Button color="hemmelig-orange" onClick={onLoadUsers}>
                        {t('users.more')}
                    </Button>
                </Center>
            )}

            <Group position="right">
                <Button
                    leftIcon={<IconPlus size={14} />}
                    onClick={() => {
                        form.setValues(defaultValues);
                        setModalState('add');
                        setSuccess(false);
                        open();
                    }}
                    color="hemmelig"
                >
                    {t('users.add')}
                </Button>
            </Group>
        </Stack>
    );
};

export default Users;
