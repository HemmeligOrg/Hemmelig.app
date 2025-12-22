import {
    Activity,
    Building2,
    ChevronDown,
    Lock,
    Save,
    Settings,
    Shield,
    Webhook,
} from 'lucide-react';
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
    allowFileUploads: boolean;
    maxPasswordAttempts: number;
    sessionTimeout: number;
    enableRateLimiting: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
    requireInviteCode: boolean;
    allowedEmailDomains: string;
    requireRegisteredUser: boolean;
    disableEmailPasswordSignup: boolean;
    webhookEnabled: boolean;
    webhookUrl: string;
    webhookSecret: string;
    webhookOnView: boolean;
    webhookOnBurn: boolean;
    metricsEnabled: boolean;
    metricsSecret: string;
    error?: string;
    managed?: boolean;
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
    const [activeTab, setActiveTab] = useState<
        'general' | 'security' | 'organization' | 'webhook' | 'metrics'
    >('general');
    const { t } = useTranslation();
    const loaderData = useLoaderData() as InstanceSettings;
    const isManaged = loaderData?.managed ?? false;

    const {
        generalSettings,
        securitySettings,
        organizationSettings,
        webhookSettings,
        metricsSettings,
        isLoading,
        error,
        initializeSettings,
        setGeneralSetting,
        setSecuritySetting,
        setOrganizationSetting,
        setWebhookSetting,
        setMetricsSetting,
        saveSettings,
    } = useInstanceStore();

    // Initialize store with loader data
    useEffect(() => {
        if (loaderData && !loaderData.error) {
            initializeSettings(loaderData);
        }
    }, [loaderData, initializeSettings]);

    const handleSaveSettings = (
        section: 'general' | 'security' | 'organization' | 'webhook' | 'metrics'
    ) => {
        if (isManaged) return;
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
        { id: 'metrics', name: t('instance_page.tabs.metrics'), icon: Activity },
    ];

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="mb-5">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {t('instance_page.title')}
                </h1>
                <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">
                    {t('instance_page.description')}
                </p>
            </div>

            {/* Managed Mode Banner */}
            {isManaged && (
                <div className="mb-5 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            {t('instance_page.managed_mode.title')}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                            {t('instance_page.managed_mode.description')}
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="mb-5">
                <div className="border-b border-gray-200 dark:border-dark-600 overflow-x-auto">
                    <nav className="flex space-x-4 sm:space-x-6 min-w-max px-0.5">
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
                                                | 'metrics'
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
                {activeTab === 'general' && (
                    <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-4">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-1.5 bg-blue-500/10">
                                <Settings className="w-4 h-4 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {t('instance_page.general_settings.title')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {t('instance_page.general_settings.description')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                                        {t('instance_page.general_settings.instance_name_label')}
                                    </label>
                                    <input
                                        type="text"
                                        value={generalSettings.instanceName}
                                        onChange={(e) =>
                                            setGeneralSetting('instanceName', e.target.value)
                                        }
                                        disabled={isManaged}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
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
                                            disabled={isManaged}
                                            className="w-full appearance-none px-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {EXPIRATION_OPTIONS.map((option) => (
                                                <option
                                                    key={option.seconds}
                                                    value={option.hours}
                                                    className="bg-gray-50 dark:bg-dark-700"
                                                >
                                                    {t(option.labelKey)}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                                            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
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
                                        disabled={isManaged}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                                    {t('instance_page.general_settings.instance_description_label')}
                                </label>
                                <textarea
                                    value={generalSettings.instanceDescription}
                                    onChange={(e) =>
                                        setGeneralSetting('instanceDescription', e.target.value)
                                    }
                                    rows={2}
                                    disabled={isManaged}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
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
                                    disabled={isManaged}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                    {t('instance_page.general_settings.important_message_hint')}
                                </p>
                            </div>

                            {!isManaged && (
                                <button
                                    onClick={() => handleSaveSettings('general')}
                                    disabled={isLoading}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>
                                        {isLoading
                                            ? t('instance_page.saving_button')
                                            : t('instance_page.save_settings_button')}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-4">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-1.5 bg-orange-500/10">
                                <Shield className="w-4 h-4 text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Security Settings
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Configure security and access controls
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/30">
                                    <div className="flex-1 min-w-0 mr-3">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                            Rate Limiting
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            Enable request rate limiting
                                        </p>
                                    </div>
                                    <label
                                        className={`relative inline-flex items-center flex-shrink-0 ${isManaged ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={securitySettings.enableRateLimiting}
                                            onChange={(e) =>
                                                setSecuritySetting(
                                                    'enableRateLimiting',
                                                    e.target.checked
                                                )
                                            }
                                            disabled={isManaged}
                                            className="sr-only peer"
                                        />
                                        <div
                                            className={`w-9 h-5 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/50 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 ${isManaged ? 'opacity-60' : ''}`}
                                        ></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/30">
                                    <div className="flex-1 min-w-0 mr-3">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                            Allow Password Protection
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            Allow users to password protect secrets
                                        </p>
                                    </div>
                                    <label
                                        className={`relative inline-flex items-center flex-shrink-0 ${isManaged ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={securitySettings.allowPasswordProtection}
                                            onChange={(e) =>
                                                setSecuritySetting(
                                                    'allowPasswordProtection',
                                                    e.target.checked
                                                )
                                            }
                                            disabled={isManaged}
                                            className="sr-only peer"
                                        />
                                        <div
                                            className={`w-9 h-5 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/50 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 ${isManaged ? 'opacity-60' : ''}`}
                                        ></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/30">
                                    <div className="flex-1 min-w-0 mr-3">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                            Allow IP Restriction
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            Allow users to restrict secrets by IP
                                        </p>
                                    </div>
                                    <label
                                        className={`relative inline-flex items-center flex-shrink-0 ${isManaged ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={securitySettings.allowIpRestriction}
                                            onChange={(e) =>
                                                setSecuritySetting(
                                                    'allowIpRestriction',
                                                    e.target.checked
                                                )
                                            }
                                            disabled={isManaged}
                                            className="sr-only peer"
                                        />
                                        <div
                                            className={`w-9 h-5 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/50 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 ${isManaged ? 'opacity-60' : ''}`}
                                        ></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/30">
                                    <div className="flex-1 min-w-0 mr-3">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                            {t(
                                                'instance_page.security_settings.allow_file_uploads_title'
                                            )}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            {t(
                                                'instance_page.security_settings.allow_file_uploads_description'
                                            )}
                                        </p>
                                    </div>
                                    <label
                                        className={`relative inline-flex items-center flex-shrink-0 ${isManaged ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={securitySettings.allowFileUploads}
                                            onChange={(e) =>
                                                setSecuritySetting(
                                                    'allowFileUploads',
                                                    e.target.checked
                                                )
                                            }
                                            disabled={isManaged}
                                            className="sr-only peer"
                                        />
                                        <div
                                            className={`w-9 h-5 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/50 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 ${isManaged ? 'opacity-60' : ''}`}
                                        ></div>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
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
                                        disabled={isManaged}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
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
                                        disabled={isManaged}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {!isManaged && (
                                <button
                                    onClick={() => handleSaveSettings('security')}
                                    disabled={isLoading}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>
                                        {isLoading
                                            ? t('instance_page.saving_button')
                                            : t('instance_page.save_settings_button')}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'organization' && (
                    <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-4">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-1.5 bg-purple-500/10">
                                <Building2 className="w-4 h-4 text-purple-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {t('organization_page.title')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {t('organization_page.description')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/30">
                                    <div className="flex-1 min-w-0 mr-3">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                            {t(
                                                'organization_page.registration_settings.invite_only_title'
                                            )}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            {t(
                                                'organization_page.registration_settings.invite_only_description'
                                            )}
                                        </p>
                                    </div>
                                    <label
                                        className={`relative inline-flex items-center flex-shrink-0 ${isManaged ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={organizationSettings.requireInviteCode}
                                            onChange={(e) =>
                                                setOrganizationSetting(
                                                    'requireInviteCode',
                                                    e.target.checked
                                                )
                                            }
                                            disabled={isManaged}
                                            className="sr-only peer"
                                        />
                                        <div
                                            className={`w-9 h-5 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/50 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 ${isManaged ? 'opacity-60' : ''}`}
                                        ></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/30">
                                    <div className="flex-1 min-w-0 mr-3">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                            {t(
                                                'organization_page.registration_settings.require_registered_user_title'
                                            )}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            {t(
                                                'organization_page.registration_settings.require_registered_user_description'
                                            )}
                                        </p>
                                    </div>
                                    <label
                                        className={`relative inline-flex items-center flex-shrink-0 ${isManaged ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={organizationSettings.requireRegisteredUser}
                                            onChange={(e) =>
                                                setOrganizationSetting(
                                                    'requireRegisteredUser',
                                                    e.target.checked
                                                )
                                            }
                                            disabled={isManaged}
                                            className="sr-only peer"
                                        />
                                        <div
                                            className={`w-9 h-5 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/50 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 ${isManaged ? 'opacity-60' : ''}`}
                                        ></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/30">
                                    <div className="flex-1 min-w-0 mr-3">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                            {t(
                                                'organization_page.registration_settings.disable_email_password_signup_title'
                                            )}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            {t(
                                                'organization_page.registration_settings.disable_email_password_signup_description'
                                            )}
                                        </p>
                                    </div>
                                    <label
                                        className={`relative inline-flex items-center flex-shrink-0 ${isManaged ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={
                                                organizationSettings.disableEmailPasswordSignup
                                            }
                                            onChange={(e) =>
                                                setOrganizationSetting(
                                                    'disableEmailPasswordSignup',
                                                    e.target.checked
                                                )
                                            }
                                            disabled={isManaged}
                                            className="sr-only peer"
                                        />
                                        <div
                                            className={`w-9 h-5 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/50 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 ${isManaged ? 'opacity-60' : ''}`}
                                        ></div>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
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
                                        disabled={isManaged}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                        {t(
                                            'organization_page.registration_settings.allowed_domains_hint'
                                        )}
                                    </p>
                                </div>
                            </div>

                            {!isManaged && (
                                <button
                                    onClick={() => handleSaveSettings('organization')}
                                    disabled={isLoading}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>
                                        {isLoading
                                            ? t('organization_page.saving_button')
                                            : t('organization_page.save_settings_button')}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'webhook' && (
                    <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-4">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-1.5 bg-green-500/10">
                                <Webhook className="w-4 h-4 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {t('webhook_settings.title')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {t('webhook_settings.description')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/30">
                                    <div className="flex-1 min-w-0 mr-3">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                            {t('webhook_settings.enable_webhooks_title')}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            {t('webhook_settings.enable_webhooks_description')}
                                        </p>
                                    </div>
                                    <label
                                        className={`relative inline-flex items-center flex-shrink-0 ${isManaged ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={webhookSettings.webhookEnabled}
                                            onChange={(e) =>
                                                setWebhookSetting(
                                                    'webhookEnabled',
                                                    e.target.checked
                                                )
                                            }
                                            disabled={isManaged}
                                            className="sr-only peer"
                                        />
                                        <div
                                            className={`w-9 h-5 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/50 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 ${isManaged ? 'opacity-60' : ''}`}
                                        ></div>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                                        {t('webhook_settings.webhook_url_label')}
                                    </label>
                                    <input
                                        type="url"
                                        value={webhookSettings.webhookUrl}
                                        onChange={(e) =>
                                            setWebhookSetting('webhookUrl', e.target.value)
                                        }
                                        placeholder={t('webhook_settings.webhook_url_placeholder')}
                                        disabled={isManaged}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                        {t('webhook_settings.webhook_url_hint')}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
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
                                        disabled={isManaged}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                        {t('webhook_settings.webhook_secret_hint')}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-dark-600 pt-3">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                    {t('webhook_settings.events_title')}
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/30">
                                        <div className="flex-1 min-w-0 mr-3">
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                                {t('webhook_settings.on_view_title')}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                                {t('webhook_settings.on_view_description')}
                                            </p>
                                        </div>
                                        <label
                                            className={`relative inline-flex items-center flex-shrink-0 ${isManaged ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={webhookSettings.webhookOnView}
                                                onChange={(e) =>
                                                    setWebhookSetting(
                                                        'webhookOnView',
                                                        e.target.checked
                                                    )
                                                }
                                                disabled={isManaged}
                                                className="sr-only peer"
                                            />
                                            <div
                                                className={`w-9 h-5 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/50 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 ${isManaged ? 'opacity-60' : ''}`}
                                            ></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/30">
                                        <div className="flex-1 min-w-0 mr-3">
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                                {t('webhook_settings.on_burn_title')}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                                {t('webhook_settings.on_burn_description')}
                                            </p>
                                        </div>
                                        <label
                                            className={`relative inline-flex items-center flex-shrink-0 ${isManaged ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={webhookSettings.webhookOnBurn}
                                                onChange={(e) =>
                                                    setWebhookSetting(
                                                        'webhookOnBurn',
                                                        e.target.checked
                                                    )
                                                }
                                                disabled={isManaged}
                                                className="sr-only peer"
                                            />
                                            <div
                                                className={`w-9 h-5 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/50 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 ${isManaged ? 'opacity-60' : ''}`}
                                            ></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {!isManaged && (
                                <button
                                    onClick={() => handleSaveSettings('webhook')}
                                    disabled={isLoading}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>
                                        {isLoading
                                            ? t('instance_page.saving_button')
                                            : t('instance_page.save_settings_button')}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'metrics' && (
                    <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-4">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-1.5 bg-cyan-500/10">
                                <Activity className="w-4 h-4 text-cyan-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {t('metrics_settings.title')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {t('metrics_settings.description')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/30">
                                    <div className="flex-1 min-w-0 mr-3">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                            {t('metrics_settings.enable_metrics_title')}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            {t('metrics_settings.enable_metrics_description')}
                                        </p>
                                    </div>
                                    <label
                                        className={`relative inline-flex items-center flex-shrink-0 ${isManaged ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={metricsSettings.metricsEnabled}
                                            onChange={(e) =>
                                                setMetricsSetting(
                                                    'metricsEnabled',
                                                    e.target.checked
                                                )
                                            }
                                            disabled={isManaged}
                                            className="sr-only peer"
                                        />
                                        <div
                                            className={`w-9 h-5 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/50 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 ${isManaged ? 'opacity-60' : ''}`}
                                        ></div>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                                        {t('metrics_settings.metrics_secret_label')}
                                    </label>
                                    <input
                                        type="password"
                                        value={metricsSettings.metricsSecret}
                                        onChange={(e) =>
                                            setMetricsSetting('metricsSecret', e.target.value)
                                        }
                                        placeholder={t(
                                            'metrics_settings.metrics_secret_placeholder'
                                        )}
                                        disabled={isManaged}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                        {t('metrics_settings.metrics_secret_hint')}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-dark-600 pt-3">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    {t('metrics_settings.endpoint_info_title')}
                                </h3>
                                <div className="p-3 bg-gray-50 dark:bg-dark-700/30">
                                    <p className="text-xs text-gray-600 dark:text-slate-300 mb-1.5">
                                        {t('metrics_settings.endpoint_info_description')}
                                    </p>
                                    <code className="block p-1.5 bg-gray-100 dark:bg-dark-600 text-xs font-mono text-gray-800 dark:text-slate-200">
                                        GET /api/metrics
                                    </code>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5">
                                        {t('metrics_settings.endpoint_auth_hint')}
                                    </p>
                                </div>
                            </div>

                            {!isManaged && (
                                <button
                                    onClick={() => handleSaveSettings('metrics')}
                                    disabled={isLoading}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>
                                        {isLoading
                                            ? t('instance_page.saving_button')
                                            : t('instance_page.save_settings_button')}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
