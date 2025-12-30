import { Mail, Save, User } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../../lib/api';
import { useAccountStore } from '../../../store/accountStore';

export function ProfileTab() {
    const { t } = useTranslation();
    const { profileData, setProfileData } = useAccountStore();
    const [isLoading, setIsLoading] = useState(false);
    const [profileError, setProfileError] = useState('');

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData({ ...profileData, [name]: value });
    };

    const handleProfileSave = async () => {
        setIsLoading(true);
        setProfileError('');
        try {
            const res = await api.account.$put({ json: profileData });
            if (res.ok) {
                const updatedData = await res.json();
                setProfileData(updatedData);
            } else if (res.status === 409) {
                setProfileError(t('account_page.profile_settings.username_taken'));
            } else {
                console.error('Failed to update profile');
            }
        } catch (error) {
            console.error('An error occurred', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-4">
            <div className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 bg-teal-500/10">
                    <User className="w-4 h-4 text-teal-500" />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {t('account_page.profile_info.title')}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                        {t('account_page.profile_info.description')}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                        {t('account_page.profile_info.username_label')}
                    </label>
                    <input
                        type="text"
                        name="username"
                        value={profileData.username}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                        {t('account_page.profile_info.email_label')}
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                        <input
                            type="email"
                            name="email"
                            value={profileData.email}
                            onChange={handleProfileChange}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        />
                    </div>
                </div>

                {profileError && (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                        {profileError}
                    </div>
                )}

                <div className="pt-2">
                    <button
                        onClick={handleProfileSave}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-3.5 h-3.5" />
                        <span>
                            {isLoading
                                ? t('account_page.profile_info.saving_button')
                                : t('account_page.profile_info.save_changes_button')}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
