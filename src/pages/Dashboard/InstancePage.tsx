import { Building2, Save, Settings, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInstanceStore } from '../../store/instanceStore';

export function InstancePage() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'organization'>('general');
  const { t } = useTranslation();

  const {
    generalSettings,
    securitySettings,
    organizationSettings,
    isLoading,
    error,
    fetchSettings,
    setGeneralSetting,
    setSecuritySetting,
    setOrganizationSetting,
    saveSettings,
  } = useInstanceStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveSettings = (section: 'general' | 'security' | 'organization') => {
    saveSettings(section);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading instance settings...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500">Error</h2>
        <p className="text-gray-500 dark:text-slate-400 mt-2">{error}</p>
      </div>
    );
  }

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'organization', name: 'Organization', icon: Building2 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {t('instance_page.title')}
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">{t('instance_page.description')}</p>
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
                    Default Secret Expiration (hours)
                  </label>
                  <input
                    type="number"
                    value={generalSettings.defaultSecretExpiration}
                    onChange={(e) =>
                      setGeneralSetting(
                        'defaultSecretExpiration',
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                    Max Secret Size (bytes)
                  </label>
                  <input
                    type="number"
                    value={generalSettings.maxSecretSize}
                    onChange={(e) =>
                      setGeneralSetting(
                        'maxSecretSize',
                        parseInt(e.target.value)
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
                    <h3 className="font-medium text-gray-900 dark:text-white">Rate Limiting</h3>
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
                      {t('organization_page.registration_settings.invite_only_title')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {t('organization_page.registration_settings.invite_only_description')}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={organizationSettings.requireInviteCode}
                      onChange={(e) =>
                        setOrganizationSetting('requireInviteCode', e.target.checked)
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
                    {t('organization_page.registration_settings.allowed_domains_title')}
                  </label>
                  <input
                    type="text"
                    value={organizationSettings.allowedEmailDomains}
                    onChange={(e) => setOrganizationSetting('allowedEmailDomains', e.target.value)}
                    placeholder={t('organization_page.registration_settings.allowed_domains_placeholder')}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {t('organization_page.registration_settings.allowed_domains_hint')}
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
      </div>
    </div>
  );
}
