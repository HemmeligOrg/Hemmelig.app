import { AlertTriangle, Code, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
import { useAccountStore } from '../../store/accountStore';
import { DangerZoneTab, DeveloperTab, ProfileTab, SecurityTab } from './Account';

export function AccountPage() {
    const { t } = useTranslation();
    const { setProfileData } = useAccountStore();
    const initialData = useLoaderData() as {
        username: string;
        email: string;
        twoFactorEnabled: boolean;
    };

    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'developer' | 'danger'>(
        'profile'
    );

    useEffect(() => {
        setProfileData({ username: initialData.username, email: initialData.email });
    }, [initialData, setProfileData]);

    const tabs = [
        { id: 'profile', name: t('account_page.tabs.profile'), icon: User },
        { id: 'security', name: t('account_page.tabs.security'), icon: Shield },
        { id: 'developer', name: t('account_page.tabs.developer'), icon: Code },
        { id: 'danger', name: t('account_page.tabs.danger_zone'), icon: AlertTriangle },
    ];

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="mb-5">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {t('account_page.title')}
                </h1>
                <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">
                    {t('account_page.description')}
                </p>
            </div>

            {/* Tabs */}
            <div className="mb-5">
                <div className="border-b border-gray-200 dark:border-dark-600">
                    <nav className="flex space-x-6 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() =>
                                        setActiveTab(
                                            tab.id as
                                                | 'profile'
                                                | 'security'
                                                | 'developer'
                                                | 'danger'
                                        )
                                    }
                                    className={`flex items-center gap-1.5 py-2.5 px-0.5 border-b-2 font-medium text-xs whitespace-nowrap transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-teal-500 text-teal-500 dark:text-teal-400'
                                            : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{tab.name}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-xl">
                {activeTab === 'profile' && <ProfileTab />}
                {activeTab === 'security' && (
                    <SecurityTab initialTwoFactorEnabled={initialData.twoFactorEnabled} />
                )}
                {activeTab === 'developer' && <DeveloperTab />}
                {activeTab === 'danger' && <DangerZoneTab />}
            </div>
        </div>
    );
}
