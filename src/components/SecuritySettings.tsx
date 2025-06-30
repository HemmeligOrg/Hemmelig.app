import { useState } from 'react';
import { Lock, Shield, Clock, Eye, Key, Globe, Flame } from 'lucide-react';
import { ToggleSwitch } from './ToggleSwitch';
import { ViewsSlider } from './ViewsSlider';
import { ExpirationSelect } from './ExpirationSelect';
import { useSecretStore } from '../store/secretStore';
import { useTranslation } from 'react-i18next';

export function SecuritySettings() {
    const { expiresAt, views, isBurnable, password, ipRange, setSecretData } = useSecretStore();
    const { t } = useTranslation();

    const [isPasswordEnabled, setIsPasswordEnabled] = useState(!!password);

    const handleIpRangeToggle = (enabled: boolean) => {
        if (enabled) {
            setSecretData({ ipRange: '' });
        } else {
            setSecretData({ ipRange: undefined });
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
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 sm:p-6 lg:p-8 shadow-2xl">
            <div className="flex items-start sm:items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex-shrink-0">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-semibold text-white">{t('security_settings.security_title')}</h2>
                    <p className="text-slate-400 text-xs sm:text-sm">{t('security_settings.security_description')}</p>
                </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
                {/* Privacy Level */}
                <div className="flex items-start p-3 sm:p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                    <div className="p-2 bg-teal-500/20 rounded-lg flex-shrink-0 mr-3">
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-white text-sm sm:text-base">{t('security_settings.private_title')}</h3>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            {t('security_settings.private_description')}
                        </p>
                    </div>
                </div>

                {/* Expiration and Views - Mobile-first responsive grid */}
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-2 sm:gap-4 lg:gap-6">
                    {/* Expiration - Always visible */}
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-300">{t('security_settings.expiration_title')}</span>
                        </div>
                        <ExpirationSelect
                            value={expiresAt}
                            onChange={(value) => setSecretData({ expiresAt: value })}
                        />
                        <p className="text-xs text-slate-400">
                            {isBurnable
                                ? t('security_settings.expiration_burn_after_time_description')
                                : t('security_settings.expiration_default_description')
                            }
                        </p>
                    </div>

                    {/* Max Views - Only show when burn after time is NOT enabled */}
                    {!isBurnable && (
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Eye className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-300">{t('security_settings.max_views_title')}</span>
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
                    <div className="p-3 sm:p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                        <div className="flex items-start space-x-3">
                            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-orange-300 text-sm sm:text-base">{t('security_settings.burn_after_time_mode_title')}</h3>
                                <p className="text-xs sm:text-sm text-orange-200/80 mt-1">
                                    {t('security_settings.burn_after_time_mode_description')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Additional Security Options - Mobile optimized */}
                <div className="space-y-3 sm:space-y-4">
                    {/* Password Protection */}
                    <div className="p-3 sm:p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300">
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className="flex items-start space-x-3 min-w-0 flex-1">
                                <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                                    <Key className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-medium text-white text-sm sm:text-base">{t('security_settings.password_protection_title')}</h3>
                                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                    {t('security_settings.password_protection_description')}
                                </p>
                                </div>
                            </div>
                            <div className="flex-shrink-0 ml-3">
                                <ToggleSwitch
                                    checked={isPasswordEnabled}
                                    onChange={val => {
                                        setIsPasswordEnabled(val);
                                        if (!val) setSecretData({ password: null });
                                    }}
                                />
                            </div>
                        </div>

                        {isPasswordEnabled && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300">
                                    {t('security_settings.enter_password_label')}
                                </label>
                                <input
                                    type="text"
                                    value={password || ''}
                                    onChange={(e) => setSecretData({ password: e.target.value })}
                                    placeholder={t('security_settings.password_placeholder')}
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-600/50 border border-slate-500/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 text-sm sm:text-base"
                                />
                                <p className="text-xs text-slate-400">
                                    {t('security_settings.password_hint')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* IP Restriction */}
                    <div className="p-3 sm:p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300">
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className="flex items-start space-x-3 min-w-0 flex-1">
                                <div className="p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
                                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-medium text-white text-sm sm:text-base">{t('security_settings.ip_restriction_title')}</h3>
                                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                    {t('security_settings.ip_restriction_description')}
                                </p>
                                </div>
                            </div>
                            <div className="flex-shrink-0 ml-3">
                                <ToggleSwitch
                                    checked={ipRange !== undefined}
                                    onChange={handleIpRangeToggle}
                                />
                            </div>
                        </div>

                        {ipRange !== undefined && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300">
                                    {t('security_settings.ip_address_cidr_label')}
                                </label>
                                <input
                                    type="text"
                                    value={ipRange || ''}
                                    onChange={(e) => setSecretData({ ipRange: e.target.value })}
                                    placeholder={t('security_settings.ip_address_cidr_placeholder')}
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-600/50 border border-slate-500/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 text-sm sm:text-base"
                                />
                                <p className="text-xs text-slate-400">
                                    {t('security_settings.ip_address_cidr_hint')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Burn After Time */}
                    <div className="flex items-start justify-between p-3 sm:p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300">
                        <div className="flex items-start space-x-3 min-w-0 flex-1">
                            <div className="p-2 bg-orange-500/20 rounded-lg flex-shrink-0">
                                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-white text-sm sm:text-base">{t('security_settings.burn_after_time_title')}</h3>
                                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                    {t('security_settings.burn_after_time_description')}
                                </p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 ml-3">
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