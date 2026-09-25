import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { SettingRow, SettingsFooter, SettingsPanel } from '../../../components/Settings';
import { api } from '../../../lib/api';
import { useAccountStore } from '../../../store/accountStore';
import { useUserStore } from '../../../store/userStore';

type SaveStatus = { tone: 'accent' | 'danger'; message: string } | null;

export function ProfileTab() {
    const { t } = useTranslation();
    const { profileData, setProfileData } = useAccountStore();
    const fetchUser = useUserStore((s) => s.fetchUser);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<SaveStatus>(null);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData({ ...profileData, [name]: value });
        setStatus(null);
    };

    const handleProfileSave = async () => {
        setIsLoading(true);
        setStatus(null);
        try {
            const res = await api.account.$put({ json: profileData });
            if (res.ok) {
                const updatedData = await res.json();
                setProfileData(updatedData);
                setStatus({ tone: 'accent', message: t('account_page.profile_info.saved') });
                // Refresh the session user so that the sidebar shows the new name.
                fetchUser();
            } else if (res.status === 409) {
                const errorData = (await res.json()) as { error?: string };
                setStatus({
                    tone: 'danger',
                    message: errorData.error?.toLowerCase().includes('email')
                        ? t('account_page.profile_settings.email_taken')
                        : t('account_page.profile_settings.username_taken'),
                });
            } else {
                setStatus({ tone: 'danger', message: t('account_page.profile_info.save_error') });
            }
        } catch (error) {
            console.error('An error occurred', error);
            setStatus({ tone: 'danger', message: t('account_page.profile_info.save_error') });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsPanel>
            <SettingRow
                label={t('account_page.profile_info.username_label')}
                description={t('account_page.profile_info.username_description')}
            >
                <Input
                    mono
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={profileData.username}
                    onChange={handleProfileChange}
                    aria-label={t('account_page.profile_info.username_label')}
                />
            </SettingRow>

            <SettingRow
                label={t('account_page.profile_info.email_label')}
                description={t('account_page.profile_info.email_description')}
            >
                <Input
                    mono
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    aria-label={t('account_page.profile_info.email_label')}
                />
            </SettingRow>

            <SettingsFooter note={status?.message} tone={status?.tone ?? 'muted'}>
                <Button variant="primary" onClick={handleProfileSave} loading={isLoading}>
                    {isLoading
                        ? t('account_page.profile_info.saving_button')
                        : t('account_page.profile_info.save_button')}
                </Button>
            </SettingsFooter>
        </SettingsPanel>
    );
}
