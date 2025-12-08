import { Building2, ChevronDown, Save, Settings, Shield, Webhook } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
import { useInstanceStore } from '../../store/instanceStore';

type InstanceSettings = {
    instanceName: string;
    instanceDescription: string;
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    maxSecretsPerUser: number;
    defaultSecretExpiration: number;
    maxSecretSize: number;
    importantMessage: string;
    enforceHttps: boolean;
    allowPasswordProtection: boolean;
    allowIpRestriction: boolean;
    maxPasswordAttempts: number;
    sessionTimeout: number;
    enableRateLimiting: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
    requireInviteCode: boolean;
    allowedEmailDomains: string;
    requireRegisteredUser: boolean;
    webhookEnabled: boolean;
    webhookUrl: string;
    webhookSecret: string;
    webhookOnView: boolean;
    webhookOnBurn: boolean;
    error?: string;
};

const EXPIRATION_OPTIONS = [
    { seconds: 2419200, hours: 672, labelKey: 'expiration.28_days' },
    { seconds: 1209600, hours: 336, labelKey: 'expiration.14_days' },
    { seconds: 604800, hours: 168, labelKey: 'expiration.7_days' },
    { seconds: 259200, hours: 72, labelKey: 'expiration.3_days' },
    { seconds: 86400, hours: 24, labelKey: 'expiration.1_day' },
    { seconds: 43200, hours: 12, labelKey: 'expiration.12_hours' },
    { seconds: 14400, hours: 4, labelKey: 'expiration.4_hours' },
    { seconds: 3600, hours: 1, labelKey: 'expiration.1_hour' },
    { seconds: 1800, hours: 0.5, labelKey: 'expiration.30_minutes' },
    { seconds: 300, hours: 5 / 60, labelKey: 'expiration.5_minutes' },
];

export function InstancePage() {
    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'organization' | 'webhook'>(
        'general'
    );
    const { t } = useTranslation();
    const loaderData = useLoaderData() as InstanceSettings;

    const {
        generalSettings,
        securitySettings,
        organizationSettings,
        webhookSettings,
        isLoading,
        error,
        initializeSettings,
        setGeneralSetting,
        setSecuritySetting,
        setOrganizationSetting,
        setWebhookSetting,
        saveSettings,
    } = useInstanceStore();

    // Initialize store with loader data
    useEffect(() => {
        if (loaderData && !loaderData.error) {
            initializeSettings(loaderData);
        }
    }, [loaderData, initializeSettings]);

    const handleSaveSettings = (section: 'general' | 'security' | 'organization' | 'webhook') => {
        saveSettings(section);
    };

    if (error || loaderData?.error) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-red-500">Error</h2>
                <p className="text-gray-500 dark:text-slate-400 mt-2">
                    {error || loaderData?.error}
                </p>
            </div>
        );
    }

    const tabs = [
        { id: 'general', name: t('instance_page.tabs.general'), icon: Settings },
        { id: 'security', name: t('instance_page.tabs.security'), icon: Shield },
        { id: 'organization', name: t('instance_page.tabs.organization'), icon: Building2 },
        { id: 'webhook', name: t('instance_page.tabs.webhook'), icon: Webhook },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {t('instance_page.title')}
                </h1>
                <p className="text-gray-500 dark:text-slate-400 mt-1">
                    {t('instance_page.description')}
                </p>
            </div>

            {/* Tabs */}
            <div className="mb-8">
                <div className="border-b border-gray-200 dark:border-dark-600 overflow-x-auto">
                    <nav className="flex space-x-4 sm:space-x-8 min-w-max px-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() =>
                                        setActiveTab(
                                            tab.id as
                                                | 'general'
                                                | 'security'
                                                | 'organization'
                                                | 'webhook'
                                        )
                                    }
                                    className={`flex items-center space-x-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                                        activeTab === tab.id
                                            ? 'border-teal-500 text-teal-500 dark:text-teal-400'
                                            : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-dark-500'
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
            <div className="w-full">
                {activeTab === 'general' && (
                    <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-4 sm:p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-blue-500/20 ">
                                <Settings className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t('instance_page.general_settings.title')}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    {t('instance_page.general_settings.description')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                        {t('instance_page.general_settings.instance_name_label')}
                                    </label>
                                    <input
                                        type="text"
                                        value={generalSettings.instanceName}
                                        onChange={(e) =>
                                            setGeneralSetting('instanceName', e.target.value)
                                        }
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                        {t(
                                            'instance_page.general_settings.default_expiration_label'
                                        )}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={generalSettings.defaultSecretExpiration}
                                            onChange={(e) =>
                                                setGeneralSetting(
                                                    'defaultSecretExpiration',
                                                    parseFloat(e.target.value)
                                                )
                                            }
                                            className="w-full appearance-none px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300 cursor-pointer"
                                        >
                                            {EXPIRATION_OPTIONS.map((option) => (
                                                <option
                                                    key={option.seconds}
                                                    value={option.hours}
                                                    className="bg-gray-100 dark:bg-dark-700"
                                                >
                                                    {t(option.labelKey)}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                        {t('instance_page.general_settings.max_secret_size_label')}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        value={(generalSettings.maxSecretSize / 1024).toFixed(1)}
                                        onChange={(e) =>
                                            setGeneralSetting(
                                                'maxSecretSize',
                                                Math.round(parseFloat(e.target.value) * 1024)
                                            )
                                        }
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                    {t('instance_page.general_settings.instance_description_label')}
                                </label>
                                <textarea
                                    value={generalSettings.instanceDescription}
                                    onChange={(e) =>
                                        setGeneralSetting('instanceDescription', e.target.value)
                                    }
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                    {t('instance_page.general_settings.important_message_label')}
                                </label>
                                <textarea
                                    value={generalSettings.importantMessage}
                                    onChange={(e) =>
                                        setGeneralSetting('importantMessage', e.target.value)
                                    }
                                    rows={2}
                                    placeholder={t(
                                        'instance_page.general_settings.important_message_placeholder'
                                    )}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                />
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                    {t('instance_page.general_settings.important_message_hint')}
                                </p>
                            </div>

                            <button
                                onClick={() => handleSaveSettings('general')}
                                disabled={isLoading}
                                className="flex items-center justify-center space-x-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                            >
                                <Save className="w-4 h-4" />
                                <span>
                                    {isLoading
                                        ? t('instance_page.saving_button')
                                        : t('instance_page.save_settings_button')}
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-4 sm:p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-orange-500/20 ">
                                <Shield className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Security Settings
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    Configure security and access controls
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700/30 ">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            Rate Limiting
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">
                                            Enable request rate limiting
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={securitySettings.enableRateLimiting}
                                            onChange={(e) =>
                                                setSecuritySetting(
                                                    'enableRateLimiting',
                                                    e.target.checked
                                                )
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700/30 ">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            Allow Password Protection
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">
                                            Allow users to password protect secrets
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={securitySettings.allowPasswordProtection}
                                            onChange={(e) =>
                                                setSecuritySetting(
                                                    'allowPasswordProtection',
                                                    e.target.checked
                                                )
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700/30 ">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            Allow IP Restriction
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">
                                            Allow users to restrict secrets by IP
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={securitySettings.allowIpRestriction}
                                            onChange={(e) =>
                                                setSecuritySetting(
                                                    'allowIpRestriction',
                                                    e.target.checked
                                                )
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                        Rate Limit Requests
                                    </label>
                                    <input
                                        type="number"
                                        value={securitySettings.rateLimitRequests}
                                        onChange={(e) =>
                                            setSecuritySetting(
                                                'rateLimitRequests',
                                                parseInt(e.target.value)
                                            )
                                        }
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                        Rate Limit Window (seconds)
                                    </label>
                                    <input
                                        type="number"
                                        value={securitySettings.rateLimitWindow}
                                        onChange={(e) =>
                                            setSecuritySetting(
                                                'rateLimitWindow',
                                                parseInt(e.target.value)
                                            )
                                        }
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => handleSaveSettings('security')}
                                disabled={isLoading}
                                className="flex items-center justify-center space-x-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                            >
                                <Save className="w-4 h-4" />
                                <span>
                                    {isLoading
                                        ? t('instance_page.saving_button')
                                        : t('instance_page.save_settings_button')}
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'organization' && (
                    <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-4 sm:p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-purple-500/20 ">
                                <Building2 className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t('organization_page.title')}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    {t('organization_page.description')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700/30 ">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            {t(
                                                'organization_page.registration_settings.invite_only_title'
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">
                                            {t(
                                                'organization_page.registration_settings.invite_only_description'
                                            )}
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={organizationSettings.requireInviteCode}
                                            onChange={(e) =>
                                                setOrganizationSetting(
                                                    'requireInviteCode',
                                                    e.target.checked
                                                )
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700/30 ">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            {t(
                                                'organization_page.registration_settings.require_registered_user_title'
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">
                                            {t(
                                                'organization_page.registration_settings.require_registered_user_description'
                                            )}
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={organizationSettings.requireRegisteredUser}
                                            onChange={(e) =>
                                                setOrganizationSetting(
                                                    'requireRegisteredUser',
                                                    e.target.checked
                                                )
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                        {t(
                                            'organization_page.registration_settings.allowed_domains_title'
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        value={organizationSettings.allowedEmailDomains}
                                        onChange={(e) =>
                                            setOrganizationSetting(
                                                'allowedEmailDomains',
                                                e.target.value
                                            )
                                        }
                                        placeholder={t(
                                            'organization_page.registration_settings.allowed_domains_placeholder'
                                        )}
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                        {t(
                                            'organization_page.registration_settings.allowed_domains_hint'
                                        )}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleSaveSettings('organization')}
                                disabled={isLoading}
                                className="flex items-center justify-center space-x-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                            >
                                <Save className="w-4 h-4" />
                                <span>
                                    {isLoading
                                        ? t('organization_page.saving_button')
                                        : t('organization_page.save_settings_button')}
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'webhook' && (
                    <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-4 sm:p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-green-500/20 ">
                                <Webhook className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t('webhook_settings.title')}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    {t('webhook_settings.description')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700/30 ">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            {t('webhook_settings.enable_webhooks_title')}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">
                                            {t('webhook_settings.enable_webhooks_description')}
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={webhookSettings.webhookEnabled}
                                            onChange={(e) =>
                                                setWebhookSetting(
                                                    'webhookEnabled',
                                                    e.target.checked
                                                )
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                        {t('webhook_settings.webhook_url_label')}
                                    </label>
                                    <input
                                        type="url"
                                        value={webhookSettings.webhookUrl}
                                        onChange={(e) =>
                                            setWebhookSetting('webhookUrl', e.target.value)
                                        }
                                        placeholder={t('webhook_settings.webhook_url_placeholder')}
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                        {t('webhook_settings.webhook_url_hint')}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                        {t('webhook_settings.webhook_secret_label')}
                                    </label>
                                    <input
                                        type="password"
                                        value={webhookSettings.webhookSecret}
                                        onChange={(e) =>
                                            setWebhookSetting('webhookSecret', e.target.value)
                                        }
                                        placeholder={t(
                                            'webhook_settings.webhook_secret_placeholder'
                                        )}
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                        {t('webhook_settings.webhook_secret_hint')}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-dark-600 pt-4">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                                    {t('webhook_settings.events_title')}
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700/30 ">
                                        <div className="flex-1 min-w-0 mr-4">
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {t('webhook_settings.on_view_title')}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                                {t('webhook_settings.on_view_description')}
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={webhookSettings.webhookOnView}
                                                onChange={(e) =>
                                                    setWebhookSetting(
                                                        'webhookOnView',
                                                        e.target.checked
                                                    )
                                                }
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700/30 ">
                                        <div className="flex-1 min-w-0 mr-4">
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {t('webhook_settings.on_burn_title')}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                                {t('webhook_settings.on_burn_description')}
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={webhookSettings.webhookOnBurn}
                                                onChange={(e) =>
                                                    setWebhookSetting(
                                                        'webhookOnBurn',
                                                        e.target.checked
                                                    )
                                                }
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleSaveSettings('webhook')}
                                disabled={isLoading}
                                className="flex items-center justify-center space-x-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                            >
                                <Save className="w-4 h-4" />
                                <span>
                                    {isLoading
                                        ? t('instance_page.saving_button')
                                        : t('instance_page.save_settings_button')}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
