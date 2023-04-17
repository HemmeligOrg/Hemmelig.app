import React, { useEffect, useState } from 'react';
import {
    Alert,
    Container,
    Stack,
    Button,
    Checkbox,
    Group,
    Input,
    Text,
    Notification,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconEdit, IconCheck, IconAlertCircle, IconAt } from '@tabler/icons';
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
            disable_user_account_creation: false,
            disable_file_upload: false,
            whitelist_organization_email: '',
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
                        label="Disable user account creation"
                        description="Do not allow users to create acoounts. However, you as an admin is allowed to add users which can sign in."
                        checked={form.getInputProps('disable_user_account_creation').value}
                        onChange={(event) =>
                            form.setValues({
                                disable_user_account_creation: event.currentTarget.checked,
                            })
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
                <Group position="left">
                    <Input.Wrapper
                        label="Whitelist email domain"
                        description="This will whitelist a certain domain for user registration. Great to use by organizations to limit who is allowed to create an user on your instance."
                    >
                        <Input
                            icon={<IconAt size={14} />}
                            placeholder="example.com"
                            value={form.getInputProps('whitelist_organization_email').value}
                            onChange={(event) =>
                                form.setValues({
                                    whitelist_organization_email: event.currentTarget.value,
                                })
                            }
                        />
                    </Input.Wrapper>
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
