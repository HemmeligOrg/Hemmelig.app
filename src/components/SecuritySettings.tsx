import { Clock, Eye, Flame, Globe, Key, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSecretSettingsStore } from '../store/secretSettingsStore';
import { useSecretStore } from '../store/secretStore';
import { ExpirationSelect } from './ExpirationSelect';
import { ToggleSwitch } from './ToggleSwitch';
import { ViewsSlider } from './ViewsSlider';

import { useHemmeligStore } from '../store/hemmeligStore';

export function SecuritySettings() {
    const { expiresAt, views, isBurnable, password, ipRange, setSecretData } = useSecretStore();
    const { saveSettings, setSaveSettings, updateSettings } = useSecretSettingsStore();
    const { settings: instanceSettings } = useHemmeligStore();
    const { t } = useTranslation();

    const [isPasswordEnabled, setIsPasswordEnabled] = useState(!!password);

    // Sync settings to localStorage when saveSettings is enabled
    useEffect(() => {
        if (saveSettings) {
            updateSettings({ expiresAt, views, isBurnable });
        }
    }, [expiresAt, views, isBurnable, saveSettings, updateSettings]);

    const handleIpRangeToggle = (enabled: boolean) => {
        if (enabled) {
            setSecretData({ ipRange: '' });
        } else {
            setSecretData({ ipRange: null });
        }
    };

    const handleBurnAfterTimeToggle = (checked: boolean) => {
        setSecretData({ isBurnable: checked });

        // When enabling burn after time, set a default expiration if none exists
        if (checked && !expiresAt) {
            const defaultExpiration = 14400; // Default to 4 hours in seconds
            setSecretData({ expiresAt: defaultExpiration });
        }
    };

    return (
        <div className="relative bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-5 sm:p-6 shadow-lg shadow-gray-200/50 dark:shadow-dark-900/50 transition-shadow duration-300 hover:shadow-xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                        {t('security_settings.security_title')}
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                        {t('security_settings.security_description')}
                    </p>
                </div>
                <div className="flex items-center space-x-2 bg-gray-50 dark:bg-dark-700/50 px-3 py-2 border border-gray-200 dark:border-dark-600">
                    <Save className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                    <span className="text-xs text-gray-500 dark:text-slate-400 hidden sm:inline">
                        {t('security_settings.remember_settings')}
                    </span>
                    <ToggleSwitch checked={saveSettings} onChange={setSaveSettings} />
                </div>
            </div>

            <div className="space-y-4">
                {/* Expiration and Views - Mobile-first responsive grid */}
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-2 sm:gap-4 lg:gap-6">
                    {/* Expiration - Always visible */}
                    <div className="space-y-2 p-4 bg-gray-50 dark:bg-dark-700/30 border border-gray-100 dark:border-dark-600/50">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 flex items-center justify-center bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                <Clock className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                                {t('security_settings.expiration_title')}
                            </span>
                        </div>
                        <ExpirationSelect
                            value={expiresAt}
                            onChange={(value) => setSecretData({ expiresAt: value })}
                        />
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                            {isBurnable
                                ? t('security_settings.expiration_burn_after_time_description')
                                : t('security_settings.expiration_default_description')}
                        </p>
                    </div>

                    {/* Max Views - Only show when burn after time is NOT enabled */}
                    {!isBurnable && (
                        <div className="space-y-2 p-4 bg-gray-50 dark:bg-dark-700/30 border border-gray-100 dark:border-dark-600/50">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 flex items-center justify-center bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400">
                                    <Eye className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                                    {t('security_settings.max_views_title')}
                                </span>
                            </div>
                            <ViewsSlider
                                value={views}
                                onChange={(value) => setSecretData({ views: value })}
                            />
                        </div>
                    )}
                </div>

                {/* Burn After Time Notice - Mobile optimized */}
                {isBurnable && (
                    <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30">
                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 flex items-center justify-center bg-orange-500/20 text-orange-400 flex-shrink-0">
                                <Flame className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-orange-400 dark:text-orange-300 text-sm sm:text-base">
                                    {t('security_settings.burn_after_time_mode_title')}
                                </h3>
                                <p className="text-xs sm:text-sm text-orange-600/80 dark:text-orange-200/80 mt-1">
                                    {t('security_settings.burn_after_time_mode_description')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Additional Security Options - Mobile optimized */}
                <div className="space-y-3">
                    {/* Password Protection */}
                    {instanceSettings.allowPasswordProtection && (
                        <div className="p-4 bg-gray-50 dark:bg-dark-700/30 border border-gray-100 dark:border-dark-600/50 transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-900/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                    <div className="w-8 h-8 flex items-center justify-center bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                        <Key className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                                        {t('security_settings.password_protection_title')}
                                    </span>
                                </div>
                                <ToggleSwitch
                                    checked={isPasswordEnabled}
                                    onChange={(val) => {
                                        setIsPasswordEnabled(val);
                                        if (!val) setSecretData({ password: null });
                                    }}
                                />
                            </div>

                            {isPasswordEnabled && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-500/50">
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                                        {t('security_settings.password_protection_description')}
                                    </p>
                                    <input
                                        type="text"
                                        value={password || ''}
                                        onChange={(e) =>
                                            setSecretData({ password: e.target.value })
                                        }
                                        placeholder={t('security_settings.password_placeholder')}
                                        minLength={5}
                                        className={`w-full px-3 py-2 bg-white dark:bg-dark-600 border text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 text-sm ${
                                            password && password.length > 0 && password.length < 5
                                                ? 'border-red-500 dark:border-red-500 focus:ring-red-500/30'
                                                : 'border-gray-300 dark:border-dark-500 focus:ring-blue-500/30 focus:border-blue-500'
                                        }`}
                                    />
                                    {password && password.length > 0 && password.length < 5 ? (
                                        <p className="text-xs text-red-500 mt-2">
                                            {t('security_settings.password_error')}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                                            {t('security_settings.password_hint')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* IP Restriction */}
                    {instanceSettings.allowIpRestriction && (
                        <div className="p-4 bg-gray-50 dark:bg-dark-700/30 border border-gray-100 dark:border-dark-600/50 transition-all duration-200 hover:border-purple-200 dark:hover:border-purple-900/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                    <div className="w-8 h-8 flex items-center justify-center bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                                        <Globe className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                                        {t('security_settings.ip_restriction_title')}
                                    </span>
                                </div>
                                <ToggleSwitch
                                    checked={ipRange !== null && ipRange !== undefined}
                                    onChange={handleIpRangeToggle}
                                />
                            </div>

                            {ipRange !== null && ipRange !== undefined && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-500/50">
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                                        {t('security_settings.ip_restriction_description')}
                                    </p>
                                    <input
                                        type="text"
                                        value={ipRange || ''}
                                        onChange={(e) => setSecretData({ ipRange: e.target.value })}
                                        placeholder={t(
                                            'security_settings.ip_address_cidr_placeholder'
                                        )}
                                        className="w-full px-3 py-2 bg-white dark:bg-dark-600 border border-gray-300 dark:border-dark-500 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all duration-200 text-sm"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Burn After Time */}
                    <div className="p-4 bg-gray-50 dark:bg-dark-700/30 border border-gray-100 dark:border-dark-600/50 transition-all duration-200 hover:border-orange-200 dark:hover:border-orange-900/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <div className="w-8 h-8 flex items-center justify-center bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
                                    <Flame className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                                    {t('security_settings.burn_after_time_title')}
                                </span>
                            </div>
                            <ToggleSwitch
                                checked={isBurnable}
                                onChange={handleBurnAfterTimeToggle}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
