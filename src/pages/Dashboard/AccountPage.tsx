import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    User,
    Mail,
    Key,
    Shield,
    Save,
    Eye,
    EyeOff,
    Trash2,
    AlertTriangle
} from 'lucide-react';

export function AccountPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'danger'>('profile');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [profileData, setProfileData] = useState({
        username: 'johndoe',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe'
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleProfileSave = async () => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Profile updated:', profileData);
        setIsLoading(false);
    };

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert(t('account_page.security_settings.password_mismatch_alert'));
            return;
        }

        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Password changed');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsLoading(false);
    };

    const handleDeleteAccount = () => {
        if (confirm(t('account_page.danger_zone.delete_account_confirm'))) {
            console.log('Account deletion requested');
        }
    };

    const tabs = [
        { id: 'profile', name: t('account_page.tabs.profile'), icon: User },
        { id: 'security', name: t('account_page.tabs.security'), icon: Shield },
        { id: 'danger', name: t('account_page.tabs.danger_zone'), icon: AlertTriangle },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('account_page.title')}</h1>
                <p className="text-slate-400 mt-1">{t('account_page.description')}</p>
            </div>

            {/* Tabs */}
            <div className="mb-8">
                <div className="border-b border-slate-700/50">
                    <nav className="flex space-x-8 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${activeTab === tab.id
                                            ? 'border-teal-500 text-teal-400'
                                            : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.name}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-2xl">
                {activeTab === 'profile' && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-teal-500/20 rounded-lg">
                                <User className="w-5 h-5 text-teal-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">{t('account_page.profile_info.title')}</h2>
                                <p className="text-sm text-slate-400">{t('account_page.profile_info.description')}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        {t('account_page.profile_info.first_name_label')}
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.firstName}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        {t('account_page.profile_info.last_name_label')}
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.lastName}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    {t('account_page.profile_info.username_label')}
                                </label>
                                <input
                                    type="text"
                                    value={profileData.username}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    {t('account_page.profile_info.email_label')}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleProfileSave}
                                    disabled={isLoading}
                                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{isLoading ? t('account_page.profile_info.saving_button') : t('account_page.profile_info.save_changes_button')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-orange-500/20 rounded-lg">
                                <Shield className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">{t('account_page.security_settings.title')}</h2>
                                <p className="text-sm text-slate-400">{t('account_page.security_settings.description')}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-md font-medium text-white mb-4">{t('account_page.security_settings.change_password_title')}</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            {t('account_page.security_settings.current_password_label')}
                                        </label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                                placeholder={t('account_page.security_settings.current_password_placeholder')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                                            >
                                                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            {t('account_page.security_settings.new_password_label')}
                                        </label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                                className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                                placeholder={t('account_page.security_settings.new_password_placeholder')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                                            >
                                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            {t('account_page.security_settings.confirm_new_password_label')}
                                        </label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                                placeholder={t('account_page.security_settings.confirm_new_password_placeholder')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handlePasswordChange}
                                        disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Key className="w-4 h-4" />
                                        <span>{isLoading ? t('account_page.security_settings.changing_password_button') : t('account_page.security_settings.change_password_button')}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'danger' && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-red-500/30 p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">{t('account_page.danger_zone.title')}</h2>
                                <p className="text-sm text-slate-400">{t('account_page.danger_zone.description')}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-md font-medium text-red-300 mb-2">{t('account_page.danger_zone.delete_account_title')}</h3>
                                        <p className="text-sm text-red-200/80 mb-4">
                                            {t('account_page.danger_zone.delete_account_description')}
                                        </p>
                                        <ul className="text-sm text-red-200/70 space-y-1 mb-4">
                                            <li>• {t('account_page.danger_zone.delete_account_bullet1')}</li>
                                            <li>• {t('account_page.danger_zone.delete_account_bullet2')}</li>
                                            <li>• {t('account_page.danger_zone.delete_account_bullet3')}</li>
                                            <li>• {t('account_page.danger_zone.delete_account_bullet4')}</li>
                                        </ul>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300 hover:scale-105"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>{t('account_page.danger_zone.delete_account_button')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
