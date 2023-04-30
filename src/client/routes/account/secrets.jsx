import { useEffect, useState } from 'react';
import { ActionIcon, Container, Text, Stack, Group, Table } from '@mantine/core';
import { useForm } from '@mantine/form';
import { openConfirmModal } from '@mantine/modals';
import { IconTrash } from '@tabler/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { getSecrets, burnSecret } from '../../api/secret';

dayjs.extend(relativeTime);

const updateSecretList = (users, form, action = 'update') => {
    return users.reduce((acc, current) => {
        if (action === 'update' && current.id === form.values.id) {
            acc.push(form.values);
        } else if (action === 'delete' && current.id === form.values.id) {
            // Skip
        } else {
            acc.push(current);
        }

        return acc;
    }, []);
};

const Secrets = () => {
    const [secrets, setSecrets] = useState([]);

    const defaultValues = {
        id: '',
        expiresAt: '',
    };

    const form = useForm({
        initialValues: defaultValues,
    });

    useEffect(() => {
        (async () => {
            const secrets = await getSecrets();

            if (!secrets?.error) {
                setSecrets(secrets);
            }
        })();
    }, []);

    const onDeleteSecret = async (secret) => {
        await burnSecret(secret.id);

        setSecrets(updateSecretList(secrets, { values: secret }, 'delete'));
    };

    const openDeleteModal = (secret) =>
        openConfirmModal({
            title: 'Delete ' + secret.id,
            centered: true,
            children: <Text size="sm">Are you sure you want to delete this secret?</Text>,
            labels: { confirm: 'Delete secret', cancel: "No don't delete it" },
            confirmProps: { color: 'red' },
            onConfirm: () => onDeleteSecret(secret),
        });

    const getTime = (expiresAt) => {
        return dayjs().to(dayjs(expiresAt));
    };

    const rows = secrets.map((secret) => (
        <tr key={secret.id}>
            <td>{secret.id}</td>
            <td>{getTime(secret.expiresAt)}</td>
            <td>
                <ActionIcon variant="filled" onClick={() => openDeleteModal(secret)}>
                    <IconTrash size="1rem" />
                </ActionIcon>
            </td>
        </tr>
    ));

    return (
        <Stack>
            <Group position="left">
                <Table horizontalSpacing="sm" highlightOnHover>
                    <thead>
                        <tr>
                            <th>Id</th>
                            <th>Expires</th>
                            <th>Delete</th>
                        </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </Table>
            </Group>
        </Stack>
    );
};

export default Secrets;
