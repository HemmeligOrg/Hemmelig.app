import { useState } from 'react';
import { Lock, Shield, Clock, Eye, Key, Globe, Flame } from 'lucide-react';
import { SecretFormData } from './SecretForm';
import { ToggleSwitch } from './ToggleSwitch';
import { ViewsSlider } from './ViewsSlider';
import { ExpirationSelect } from './ExpirationSelect';

interface SecuritySettingsProps {
    formData: SecretFormData;
    onChange: (updates: Partial<SecretFormData>) => void;
}

export function SecuritySettings({ formData, onChange }: SecuritySettingsProps) {
    const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);

    const handleIpRangeToggle = (enabled: boolean) => {
        if (enabled) {
            onChange({ ipRange: '' });
        } else {
            onChange({ ipRange: undefined });
        }
    };

    const handleBurnAfterTimeToggle = (isBurnable: boolean) => {
        onChange({ isBurnable });

        // When enabling burn after time, set a default expiration if none exists
        if (isBurnable && !formData.expiresAt) {
            const defaultExpiration = 14400; // Default to 4 hours in seconds
            onChange({ isBurnable, expiresAt: defaultExpiration });
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 sm:p-6 lg:p-8 shadow-2xl">
            <div className="flex items-start sm:items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex-shrink-0">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-semibold text-white">Security</h2>
                    <p className="text-slate-400 text-xs sm:text-sm">Configure security settings for your secret</p>
                </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
                {/* Privacy Level */}
                <div className="flex items-start p-3 sm:p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                    <div className="p-2 bg-teal-500/20 rounded-lg flex-shrink-0 mr-3">
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-white text-sm sm:text-base">Private</h3>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            Private secrets are encrypted and can only be viewed with the decryption key, and/or password.
                        </p>
                    </div>
                </div>

                {/* Expiration and Views - Mobile-first responsive grid */}
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-2 sm:gap-4 lg:gap-6">
                    {/* Expiration - Always visible */}
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-300">Expiration</span>
                        </div>
                        <ExpirationSelect
                            value={formData.expiresAt}
                            onChange={(expiresAt) => onChange({ expiresAt })}
                        />
                        <p className="text-xs text-slate-400">
                            {formData.isBurnable
                                ? "Set when the secret should be destroyed"
                                : "Set how long the secret should be available"
                            }
                        </p>
                    </div>

                    {/* Max Views - Only show when burn after time is NOT enabled */}
                    {!formData.isBurnable && (
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Eye className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-300">Max views</span>
                            </div>
                            <ViewsSlider
                                value={formData.views}
                                onChange={(views) => onChange({ views })}
                            />
                        </div>
                    )}
                </div>

                {/* Burn After Time Notice - Mobile optimized */}
                {formData.isBurnable && (
                    <div className="p-3 sm:p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                        <div className="flex items-start space-x-3">
                            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-orange-300 text-sm sm:text-base">Burn After Time Mode</h3>
                                <p className="text-xs sm:text-sm text-orange-200/80 mt-1">
                                    The secret will be destroyed after the time expires, regardless of how many times it's viewed.
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
                                    <h3 className="font-medium text-white text-sm sm:text-base">Password Protection</h3>
                                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                        Add an additional layer of security with a password
                                    </p>
                                </div>
                            </div>
                            <div className="flex-shrink-0 ml-3">
                                <ToggleSwitch
                                    checked={isPasswordEnabled}
                                    onChange={val => setIsPasswordEnabled(val)}
                                />
                            </div>
                        </div>

                        {isPasswordEnabled && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300">
                                    Enter Password
                                </label>
                                <input
                                    type="text"
                                    value={formData.password}
                                    onChange={(e) => onChange({ password: e.target.value })}
                                    placeholder="Enter a secure password..."
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-600/50 border border-slate-500/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 text-sm sm:text-base"
                                />
                                <p className="text-xs text-slate-400">
                                    Recipients will need this password to view the secret
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
                                    <h3 className="font-medium text-white text-sm sm:text-base">Restrict by IP or CIDR</h3>
                                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                        The CIDR input will allow users to specify IP address ranges that can access the secret.
                                    </p>
                                </div>
                            </div>
                            <div className="flex-shrink-0 ml-3">
                                <ToggleSwitch
                                    checked={formData.ipRange !== undefined}
                                    onChange={handleIpRangeToggle}
                                />
                            </div>
                        </div>

                        {formData.ipRange !== undefined && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300">
                                    IP Address or CIDR Range
                                </label>
                                <input
                                    type="text"
                                    value={formData.ipRange}
                                    onChange={(e) => onChange({ ipRange: e.target.value })}
                                    placeholder="192.168.1.0/24 or 203.0.113.5"
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-600/50 border border-slate-500/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 text-sm sm:text-base"
                                />
                                <p className="text-xs text-slate-400">
                                    Only requests from these IP addresses will be able to access the secret
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
                                <h3 className="font-medium text-white text-sm sm:text-base">Burn after time expires</h3>
                                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                    Burn the secret only after the time expires
                                </p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 ml-3">
                            <ToggleSwitch
                                checked={formData.isBurnable}
                                onChange={handleBurnAfterTimeToggle}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
