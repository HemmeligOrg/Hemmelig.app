import React, { useEffect, useState } from 'react';
import {
    Alert,
    Container,
    Stack,
    Button,
    Checkbox,
    Group,
    Text,
    Notification,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconEdit, IconCheck, IconAlertCircle } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

import { getSettings, updateSettings } from '../../api/settings';

const Settings = () => {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const { t } = useTranslation();

    const form = useForm({
        initialValues: {
            read_only: false,
            disable_users: false,
            disable_file_upload: false,
        },
    });

    useEffect(() => {
        (async () => {
            const [data] = await getSettings();
            form.setValues(data);
        })();
    }, []);

    const onUpdateSettings = async (e) => {
        e.preventDefault();

        const data = await updateSettings(form.values);

        if ([401, 403, 500].includes(data.statusCode)) {
            setError(data.error);

            return;
        }

        form.setValues(data);

        setSuccess(true);

        setTimeout(() => {
            setSuccess(false);
        }, 3500);
    };

    return (
        <Container size="xs ">
            <Stack>
                {error && (
                    <Alert
                        icon={<IconAlertCircle size="1rem" />}
                        title={t('home.bummer')}
                        color="red"
                        variant="outline"
                    >
                        {error}
                    </Alert>
                )}
                {success && (
                    <Notification
                        icon={<IconCheck size="1.1rem" />}
                        color="teal"
                        title={t('settings.success')}
                        withCloseButton={false}
                    >
                        {t('settings.updated')}
                    </Notification>
                )}

                <Text size="sm">{t('settings.description')}</Text>
                <Group position="left">
                    <Checkbox
                        label="Read only mode"
                        description="Should the Hemmelig instance be read only for non admin users?"
                        checked={form.getInputProps('read_only').value}
                        onChange={(event) =>
                            form.setValues({ read_only: event.currentTarget.checked })
                        }
                    />
                </Group>
                <Group position="left">
                    <Checkbox
                        label="Disable users"
                        description="Should user sign in be disabled?"
                        checked={form.getInputProps('disable_users').value}
                        onChange={(event) =>
                            form.setValues({ disable_users: event.currentTarget.checked })
                        }
                    />
                </Group>
                <Group position="left">
                    <Checkbox
                        label="Disable file upload"
                        description="Disable file upload for your instance."
                        checked={form.getInputProps('disable_file_upload').value}
                        onChange={(event) =>
                            form.setValues({ disable_file_upload: event.currentTarget.checked })
                        }
                    />
                </Group>
                <Group position="right">
                    <Button
                        leftIcon={<IconEdit size={14} />}
                        onClick={onUpdateSettings}
                        color="hemmelig"
                        disabled={success}
                    >
                        {t('settings.update')}
                    </Button>
                </Group>
            </Stack>
        </Container>
    );
};

export default Settings;
