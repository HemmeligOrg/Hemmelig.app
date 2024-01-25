import { useEffect, useState } from 'react';
import { Stack, Button, Checkbox, Group, Input, Text, Container, Loader } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconEdit, IconAt } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import ErrorBox from '../../components/error-box';
import SuccessBox from '../../components/success-box';

import { getSettings, updateSettings } from '../../api/settings';

const Settings = () => {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userError, setUserError] = useState(null);

    const { t } = useTranslation();

    const form = useForm({
        initialValues: {
            read_only: false,
            disable_users: false,
            disable_user_account_creation: false,
            disable_file_upload: false,
            Restrict_organization_email: '',
        },
    });

    useEffect(() => {
        (async () => {
            try {
                const adminSettings = await getSettings();

                if (adminSettings.error || [401, 403, 500].includes(adminSettings.statusCode)) {
                    setUserError(adminSettings.error ? adminSettings.error : 'Not logged in');

                    return;
                }

                form.setValues(adminSettings[0]);

                setIsLoading(false);
                setUserError(null);
            } catch (err) {
                setUserError(err);
            }
        })();
    }, []);

    const onUpdateSettings = async (e) => {
        e.preventDefault();

        try {
            const updatedAdminSettings = await updateSettings(form.values);

            if (
                updatedAdminSettings.error ||
                [401, 403, 500].includes(updatedAdminSettings.statusCode)
            ) {
                setError(
                    updatedAdminSettings.error
                        ? updatedAdminSettings.error
                        : 'Something went wrong!'
                );

                return;
            }

            form.setValues(updatedAdminSettings);

            setError(null);
            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
            }, 2500);
        } catch (err) {
            setError(err);
        }
    };

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
            {success && <SuccessBox message={'settings.updated'} />}

            <Text size="sm">{t('settings.description')}</Text>
            <Group position="left">
                <Checkbox
                    label="Read only mode"
                    description="Should the Hemmelig instance be read only for non admin users?"
                    checked={form.getInputProps('read_only').value}
                    onChange={(event) => form.setValues({ read_only: event.currentTarget.checked })}
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
                    description="Do not allow users to create a new account. As an admin, you will still be able to create new user accounts."
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
                    label="Restrict to email domain"
                    description="This will limit user registration for a certain email domain."
                >
                    <Input
                        icon={<IconAt size={14} />}
                        placeholder="example.com"
                        value={form.getInputProps('restrict_organization_email').value}
                        onChange={(event) =>
                            form.setValues({
                                restrict_organization_email: event.currentTarget.value,
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
    );
};

export default Settings;
