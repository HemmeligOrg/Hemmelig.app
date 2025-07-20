import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Server,
    Settings,
    Database,
    Shield,
    Mail,
    Save,
    AlertTriangle,
    Info,
    CheckCircle,
} from 'lucide-react';
import { useInstanceStore } from '../../store/instanceStore';

export function InstancePage() {
    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'email' | 'database' | 'system'>('general');
    const { t } = useTranslation();

    const {
        systemInfo,
        generalSettings,
        securitySettings,
        emailSettings,
        isLoading,
        fetchStatus,
        fetchSettings,
        setGeneralSetting,
        setSecuritySetting,
        setEmailSetting,
        saveSettings,
    } = useInstanceStore();

    useEffect(() => {
        fetchStatus();
        fetchSettings();
    }, [fetchStatus, fetchSettings]);

    const handleSaveSettings = (section: 'general' | 'security' | 'email') => {
        saveSettings(section);
    };

    const tabs = [
        { id: 'general', name: 'General', icon: Settings },
        { id: 'security', name: 'Security', icon: Shield },
        { id: 'email', name: 'Email', icon: Mail },
        { id: 'database', name: 'Database', icon: Database },
        { id: 'system', name: 'System', icon: Server },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('instance_page.title')}</h1>
                <p className="text-slate-400 mt-1">{t('instance_page.description')}</p>
            </div>

            {/* System Status */}
            <div className="mb-8 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">{t('instance_page.system_status.title')}</h2>
                        <p className="text-sm text-slate-400">{t('instance_page.system_status.description')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">{t('instance_page.system_status.version')}</p>
                                <p className="text-lg font-semibold text-white">{systemInfo.version}</p>
                            </div>
                            <Info className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>

                    <div className="bg-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">{t('instance_page.system_status.uptime')}</p>
                                <p className="text-lg font-semibold text-white">{systemInfo.uptime}</p>
                            </div>
                            <Server className="w-5 h-5 text-green-400" />
                        </div>
                    </div>

                    <div className="bg-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">{t('instance_page.system_status.memory')}</p>
                                <p className="text-lg font-semibold text-white">{systemInfo.memoryUsage}</p>
                            </div>
                            <Database className="w-5 h-5 text-yellow-400" />
                        </div>
                    </div>

                    <div className="bg-slate-700/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">{t('instance_page.system_status.cpu_usage')}</p>
                                <p className="text-lg font-semibold text-white">{systemInfo.cpuUsage}</p>
                            </div>
                            <Settings className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                </div>
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
                                    onClick={() => setActiveTab(tab.id as 'general' | 'security' | 'email' | 'database' | 'system')}
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
            <div className="max-w-4xl">
                {activeTab === 'general' && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Settings className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">{t('instance_page.general_settings.title')}</h2>
                                <p className="text-sm text-slate-400">{t('instance_page.general_settings.description')}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        {t('instance_page.general_settings.instance_name_label')}
                                    </label>
                                    <input
                                        type="text"
                                        value={generalSettings.instanceName}
                                        onChange={(e) => setGeneralSetting('instanceName', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        {t('instance_page.general_settings.max_secrets_per_user_label')}
                                    </label>
                                    <input
                                        type="number"
                                        value={generalSettings.maxSecretsPerUser}
                                        onChange={(e) => setGeneralSetting('maxSecretsPerUser', parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Default Secret Expiration (hours)
                                    </label>
                                    <input
                                        type="number"
                                        value={generalSettings.defaultSecretExpiration}
                                        onChange={(e) => setGeneralSetting('defaultSecretExpiration', parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Max Secret Size (bytes)
                                    </label>
                                    <input
                                        type="number"
                                        value={generalSettings.maxSecretSize}
                                        onChange={(e) => setGeneralSetting('maxSecretSize', parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    {t('instance_page.general_settings.instance_description_label')}
                                </label>
                                <textarea
                                    value={generalSettings.instanceDescription}
                                    onChange={(e) => setGeneralSetting('instanceDescription', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                />
                            </div>

                            <button
                                onClick={() => handleSaveSettings('general')}
                                disabled={isLoading}
                                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                <span>{isLoading ? t('instance_page.saving_button') : t('instance_page.save_settings_button')}</span>
                            </button>
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
                                <h2 className="text-lg font-semibold text-white">Security Settings</h2>
                                <p className="text-sm text-slate-400">Configure security and access controls</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-white">Enforce HTTPS</h3>
                                        <p className="text-sm text-slate-400">Require secure connections</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={securitySettings.enforceHttps}
                                            onChange={(e) => setSecuritySetting('enforceHttps', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-white">Rate Limiting</h3>
                                        <p className="text-sm text-slate-400">Enable request rate limiting</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={securitySettings.enableRateLimiting}
                                            onChange={(e) => setSecuritySetting('enableRateLimiting', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-white">Allow Password Protection</h3>
                                        <p className="text-sm text-slate-400">Allow users to password protect secrets</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={securitySettings.allowPasswordProtection}
                                            onChange={(e) => setSecuritySetting('allowPasswordProtection', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-white">Allow IP Restriction</h3>
                                        <p className="text-sm text-slate-400">Allow users to restrict secrets by IP</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={securitySettings.allowIpRestriction}
                                            onChange={(e) => setSecuritySetting('allowIpRestriction', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Max Password Attempts
                                    </label>
                                    <input
                                        type="number"
                                        value={securitySettings.maxPasswordAttempts}
                                        onChange={(e) => setSecuritySetting('maxPasswordAttempts', parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Session Timeout (hours)
                                    </label>
                                    <input
                                        type="number"
                                        value={securitySettings.sessionTimeout}
                                        onChange={(e) => setSecuritySetting('sessionTimeout', parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Rate Limit Requests
                                    </label>
                                    <input
                                        type="number"
                                        value={securitySettings.rateLimitRequests}
                                        onChange={(e) => setSecuritySetting('rateLimitRequests', parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Rate Limit Window (seconds)
                                    </label>
                                    <input
                                        type="number"
                                        value={securitySettings.rateLimitWindow}
                                        onChange={(e) => setSecuritySetting('rateLimitWindow', parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => handleSaveSettings('security')}
                                disabled={isLoading}
                                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                <span>{isLoading ? t('instance_page.saving_button') : t('instance_page.save_settings_button')}</span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'email' && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 opacity-50 cursor-not-allowed">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <Mail className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Email Settings <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Coming</span></h2>
                                <p className="text-sm text-slate-400">Configure SMTP and email notifications</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        {t('instance_page.general_settings.email_verification_title')}
                                    </label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={generalSettings.requireEmailVerification}
                                            onChange={(e) => setGeneralSetting('requireEmailVerification', e.target.checked)}
                                            className="sr-only peer"
                                            disabled
                                        />
                                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                    </label>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        SMTP Host
                                    </label>
                                    <input
                                        type="text"
                                        value={emailSettings.smtpHost}
                                        onChange={(e) => setEmailSetting('smtpHost', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                        disabled
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        SMTP Port
                                    </label>
                                    <input
                                        type="number"
                                        value={emailSettings.smtpPort}
                                        onChange={(e) => setEmailSetting('smtpPort', parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={emailSettings.smtpUsername}
                                        onChange={(e) => setEmailSetting('smtpUsername', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                        disabled
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        value={emailSettings.smtpPassword}
                                        onChange={(e) => setEmailSetting('smtpPassword', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        From Email
                                    </label>
                                    <input
                                        type="email"
                                        value={emailSettings.fromEmail}
                                        onChange={(e) => setEmailSetting('fromEmail', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                        disabled
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        From Name
                                    </label>
                                    <input
                                        type="text"
                                        value={emailSettings.fromName}
                                        onChange={(e) => setEmailSetting('fromName', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                <div>
                                    <h3 className="font-medium text-white">SMTP Secure</h3>
                                    <p className="text-sm text-slate-400">Use TLS for SMTP connection</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={emailSettings.smtpSecure}
                                        onChange={(e) => setEmailSetting('smtpSecure', e.target.checked)}
                                        className="sr-only peer"
                                        disabled
                                    />
                                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                </label>
                            </div>

                            <button
                                onClick={() => handleSaveSettings('email')}
                                disabled={isLoading}
                                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                <span>{isLoading ? t('instance_page.saving_button') : t('instance_page.save_settings_button')}</span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'database' && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Database className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Database Information</h2>
                                <p className="text-sm text-slate-400">Database status and statistics</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-slate-700/30 rounded-lg p-4">
                                <h3 className="font-medium text-white mb-3">Database Stats</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Total Secrets:</span>
                                        <span className="text-white">{systemInfo.totalSecrets}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Total Users:</span>
                                        <span className="text-white">{systemInfo.totalUsers}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">{t('instance_page.database_info.disk_usage')}</span>
                                        <span className="text-white">{systemInfo.diskUsage}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-700/30 rounded-lg p-4">
                                <h3 className="font-medium text-white mb-3">Connection Status</h3>
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span className="text-green-400">Connected</span>
                                </div>
                                <p className="text-sm text-slate-400 mt-2">
                                    Database is healthy and responding normally
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <Server className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">System Information</h2>
                                <p className="text-sm text-slate-400">Server details and maintenance</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="bg-slate-700/30 rounded-lg p-4">
                                    <h3 className="font-medium text-white mb-3">System Info</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Version:</span>
                                            <span className="text-white">{systemInfo.version}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Uptime:</span>
                                            <span className="text-white">{systemInfo.uptime}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Status:</span>
                                            <span className="text-green-400 capitalize">{systemInfo.status}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-700/30 rounded-lg p-4">
                                    <h3 className="font-medium text-white mb-3">Resource Usage</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Memory:</span>
                                            <span className="text-white">{systemInfo.memoryUsage}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">CPU:</span>
                                            <span className="text-white">{systemInfo.cpuUsage}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Disk:</span>
                                            <span className="text-white">{systemInfo.diskUsage}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
