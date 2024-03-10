import { Button, Checkbox, Group, Input, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAt, IconEdit } from '@tabler/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
import ErrorBox from '../../components/error-box';
import SuccessBox from '../../components/success-box';

import { updateSettings } from '../../api/settings';

const Settings = () => {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userError, setUserError] = useState(null);

    const { t } = useTranslation();

    const adminSettings = useLoaderData();

    const form = useForm({
        initialValues: adminSettings,
    });

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
                        : t('something_went_wrong')
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

    if (adminSettings.error || [401, 403, 500].includes(adminSettings.statusCode)) {
        const error = adminSettings.error ? adminSettings.error : t('not_logged_in');

        return (
            <Stack>
                <ErrorBox message={error} />
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
                    label={t('account.settings.read_only_mode')}
                    description={t('account.settings.readonly_only_for_non_admin')}
                    checked={form.getInputProps('read_only').value}
                    onChange={(event) => form.setValues({ read_only: event.currentTarget.checked })}
                />
            </Group>
            <Group position="left">
                <Checkbox
                    label={t('account.settings.disable_users')}
                    description={t('account.settings.disable_signin')}
                    checked={form.getInputProps('disable_users').value}
                    onChange={(event) =>
                        form.setValues({ disable_users: event.currentTarget.checked })
                    }
                />
            </Group>
            <Group position="left">
                <Checkbox
                    label={t('account.settings.disable_user_account_creation')}
                    description={t('account.settings.disable_user_account_creation_description')}
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
                    label={t('account.settings.disable_file_upload')}
                    description={t('account.settings.disable_file_upload_description')}
                    checked={form.getInputProps('disable_file_upload').value}
                    onChange={(event) =>
                        form.setValues({ disable_file_upload: event.currentTarget.checked })
                    }
                />
            </Group>
            <Group position="left">
                <Input.Wrapper
                    label={t('account.settings.restrict_organization_email')}
                    description={t('account.settings.restrict_organization_email_description')}
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
