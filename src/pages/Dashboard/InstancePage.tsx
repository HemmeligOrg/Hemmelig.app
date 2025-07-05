import React, { useState } from 'react';
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

export function InstancePage() {
    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'email' | 'database' | 'system'>('general');
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    const [generalSettings, setGeneralSettings] = useState({
        instanceName: 'Hemmelig Instance',
        instanceDescription: 'Secure secret sharing platform',
        allowRegistration: true,
        requireEmailVerification: false,
        maxSecretsPerUser: 100,
        defaultSecretExpiration: 72, // hours
        maxSecretSize: 1024 // KB
    });

    const [securitySettings, setSecuritySettings] = useState({
        enforceHttps: true,
        allowPasswordProtection: true,
        allowIpRestriction: true,
        maxPasswordAttempts: 3,
        sessionTimeout: 24, // hours
        enableRateLimiting: true,
        rateLimitRequests: 100,
        rateLimitWindow: 60 // minutes
    });

    const [emailSettings, setEmailSettings] = useState({
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpUsername: 'noreply@example.com',
        smtpPassword: '',
        smtpSecure: true,
        fromEmail: 'noreply@example.com',
        fromName: 'Hemmelig'
    });

    const [systemInfo] = useState({
        version: '2.1.0',
        uptime: '15 days, 3 hours',
        totalSecrets: 1247,
        totalUsers: 89,
        diskUsage: '2.3 GB',
        memoryUsage: '512 MB',
        cpuUsage: '12%',
        status: 'healthy'
    });

    const handleSaveSettings = async (section: string) => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Saved ${section} settings`);
        setIsLoading(false);
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        {t('instance_page.general_settings.instance_name_label')}
                                    </label>
                                    <input
                                        type="text"
                                        value={generalSettings.instanceName}
                                        onChange={(e) => setGeneralSettings(prev => ({ ...prev, instanceName: e.target.value }))}
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
                                        onChange={(e) => setGeneralSettings(prev => ({ ...prev, maxSecretsPerUser: parseInt(e.target.value) }))}
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
                                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, instanceDescription: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-white">{t('instance_page.general_settings.allow_registration_title')}</h3>
                                        <p className="text-sm text-slate-400">{t('instance_page.general_settings.allow_registration_description')}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={generalSettings.allowRegistration}
                                            onChange={(e) => setGeneralSettings(prev => ({ ...prev, allowRegistration: e.target.checked }))}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-white">{t('instance_page.general_settings.email_verification_title')}</h3>
                                        <p className="text-sm text-slate-400">{t('instance_page.general_settings.email_verification_description')}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={generalSettings.requireEmailVerification}
                                            onChange={(e) => setGeneralSettings(prev => ({ ...prev, requireEmailVerification: e.target.checked }))}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                    </label>
                                </div>
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
                                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, enforceHttps: e.target.checked }))}
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
                                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, enableRateLimiting: e.target.checked }))}
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
                                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxPasswordAttempts: parseInt(e.target.value) }))}
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
                                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
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
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <Mail className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Email Settings</h2>
                                <p className="text-sm text-slate-400">Configure SMTP and email notifications</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        SMTP Host
                                    </label>
                                    <input
                                        type="text"
                                        value={emailSettings.smtpHost}
                                        onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        SMTP Port
                                    </label>
                                    <input
                                        type="number"
                                        value={emailSettings.smtpPort}
                                        onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
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
                                        onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUsername: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        value={emailSettings.smtpPassword}
                                        onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>
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
                                        <span className="text-slate-400">Disk Usage:</span>
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

                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-medium text-red-300 mb-2">Maintenance Actions</h3>
                                        <p className="text-sm text-red-200/80 mb-4">
                                            These actions can affect system availability. Use with caution.
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300">
                                                Restart Service
                                            </button>
                                            <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all duration-300">
                                                Clear Cache
                                            </button>
                                            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-300">
                                                Export Logs
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
