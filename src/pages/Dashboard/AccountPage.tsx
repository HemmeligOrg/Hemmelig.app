import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { Tabs } from '../../components/Tabs';
import { useAccountStore } from '../../store/accountStore';
import { DangerZoneTab, DeveloperTab, ProfileTab, SecurityTab } from './Account';

type AccountTab = 'profile' | 'security' | 'developer' | 'danger';

export function AccountPage() {
    const { t } = useTranslation();
    const { setProfileData } = useAccountStore();
    const initialData = useLoaderData() as {
        username: string;
        email: string;
        twoFactorEnabled: boolean;
    };

    const [activeTab, setActiveTab] = useState<AccountTab>('profile');

    useEffect(() => {
        setProfileData({ username: initialData.username, email: initialData.email });
    }, [initialData, setProfileData]);

    const tabs: { id: AccountTab; label: string }[] = [
        { id: 'profile', label: t('account_page.tabs.profile') },
        { id: 'security', label: t('account_page.tabs.security') },
        { id: 'developer', label: t('account_page.tabs.developer') },
        { id: 'danger', label: t('account_page.tabs.danger_zone') },
    ];

    return (
        <div className="grid gap-5 content-start">
            <PageHeader
                title={t('account_page.title')}
                description={t('account_page.description')}
            />

            <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'security' && (
                <SecurityTab initialTwoFactorEnabled={initialData.twoFactorEnabled} />
            )}
            {activeTab === 'developer' && <DeveloperTab />}
            {activeTab === 'danger' && <DangerZoneTab />}
        </div>
    );
}
