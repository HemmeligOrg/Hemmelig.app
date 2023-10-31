import { useEffect, useState } from 'react';
import { ActionIcon, Text, Stack, Group, Table, Container, Loader } from '@mantine/core';
import { useForm } from '@mantine/form';
import { openConfirmModal } from '@mantine/modals';
import { IconTrash } from '@tabler/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslation } from 'react-i18next';
import ErrorBox from '../../components/error-box';
import SuccessBox from '../../components/success-box';

import { getSecrets, burnSecret } from '../../api/secret';

dayjs.extend(relativeTime);

const updateSecretList = (secrets, form, action = 'update') => {
    return secrets.reduce((acc, current) => {
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
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userError, setUserError] = useState(null);
    const [success, setSuccess] = useState(false);

    const { t } = useTranslation();

    const defaultValues = {
        id: '',
        expiresAt: '',
    };

    const form = useForm({
        initialValues: defaultValues,
    });

    useEffect(() => {
        (async () => {
            try {
                const secrets = await getSecrets();

                if (secrets.error || [401, 500].includes(secrets.statusCode)) {
                    setUserError(secrets.error ? secrets.error : 'Not logged in');

                    return;
                }

                setSecrets(secrets);

                setIsLoading(false);
                setUserError(null);
            } catch (err) {
                setUserError(err);
            }
        })();
    }, []);

    const onDeleteSecret = async (secret) => {
        try {
            const burnedSecret = await burnSecret(secret.id);

            if (burnedSecret.error) {
                setError(burnedSecret.error ? burnedSecret.error : 'Something went wrong!');

                return;
            }

            setSecrets(updateSecretList(secrets, { values: secret }, 'delete'));

            setError(null);
            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
            }, 2500);
        } catch (err) {
            setError(err);
        }
    };

    const openDeleteModal = (secret) => {
        setSuccess(false);
        openConfirmModal({
            title: 'Delete ' + secret.id,
            centered: true,
            children: <Text size="sm">Are you sure you want to delete this secret?</Text>,
            labels: { confirm: 'Delete secret', cancel: "No don't delete it" },
            confirmProps: { color: 'red' },
            onConfirm: () => onDeleteSecret(secret),
        });
    };

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

    return (
        <Stack>
            {error && <ErrorBox message={error} />}
            {success && <SuccessBox message={'secrets.deleted'} />}
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
