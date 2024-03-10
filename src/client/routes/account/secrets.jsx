import { ActionIcon, Group, Stack, Table, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { openConfirmModal } from '@mantine/modals';
import { IconTrash } from '@tabler/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
import ErrorBox from '../../components/error-box';
import SuccessBox from '../../components/success-box';

import { burnSecret } from '../../api/secret';

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
    const [secrets, setSecrets] = useState(useLoaderData());
    const [success, setSuccess] = useState(false);

    const { t } = useTranslation();

    const defaultValues = {
        id: '',
        expiresAt: '',
    };

    const form = useForm({
        initialValues: defaultValues,
    });

    if (secrets.error || [401, 500].includes(secrets.statusCode)) {
        const error = secrets.error ? secrets.error : t('not_logged_in');

        return (
            <Stack>
                <ErrorBox message={error} />
            </Stack>
        );

        return;
    }

    const onDeleteSecret = async (secret) => {
        try {
            const burnedSecret = await burnSecret(secret.id);

            if (burnedSecret.error) {
                setError(burnedSecret.error ? burnedSecret.error : t('something_went_wrong'));

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
            title: t('account.secrets.delete') + ' ' + secret.id,
            centered: true,
            children: <Text size="sm">{t('account.secrets.do_you_want_delete')}</Text>,
            labels: {
                confirm: t('account.secrets.delete_secret'),
                cancel: t('account.secrets.dont_delete_secret'),
            },
            confirmProps: { color: 'red' },
            onConfirm: () => onDeleteSecret(secret),
        });
    };

    const getTime = (expiresAt) => {
        return dayjs().to(dayjs(expiresAt));
    };

    const rows = secrets.map((secret) => (
        <tr key={secret.id}>
            <td>{secret.isPublic ? secret.title : secret.id}</td>
            <td>{getTime(secret.expiresAt)}</td>
            <td>{secret.isPublic ? t('account.secrets.yes') : t('account.secrets.no')}</td>
            <td>
                <ActionIcon variant="filled" onClick={() => openDeleteModal(secret)}>
                    <IconTrash size="1rem" />
                </ActionIcon>
            </td>
        </tr>
    ));

    return (
        <Stack>
            {success && <SuccessBox message={'secrets.deleted'} />}
            <Group position="left">
                <Table horizontalSpacing="sm" highlightOnHover>
                    <thead>
                        <tr>
                            <th>{t('account.secrets.id')}</th>
                            <th>{t('account.secrets.expires')}</th>
                            <th>{t('account.secrets.public')}</th>
                            <th>{t('account.secrets.delete')}</th>
                        </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </Table>
            </Group>
        </Stack>
    );
};

export default Secrets;
