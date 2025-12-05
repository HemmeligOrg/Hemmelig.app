import { Check, Copy, Eye, EyeOff, Plus } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useSecretStore } from '../store/secretStore';

import { useHemmeligStore } from '../store/hemmeligStore';

export const SecretSettings = () => {
    const { secretId, decryptionKey, password, resetSecret } = useSecretStore();
    const { t } = useTranslation();
    const { settings: instanceSettings } = useHemmeligStore();
    const secretUrl = `${window.location.origin}/secret/${secretId}${!password ? `#decryptionKey=${decryptionKey}` : ''}`;
    const [copied, setCopied] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
    };

    const handleBurnSecret = async () => {
        try {
            await api.secrets[':id'].$delete({ param: { id: secretId } });
            resetSecret();
        } catch (error) {
            console.error('Failed to burn secret:', error);
            alert(t('secret_settings.failed_to_burn'));
        }
    };

    return (
        <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-4 sm:p-6 shadow-xl mt-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {t('secret_settings.secret_created_title')}
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mb-4">
                {t('secret_settings.secret_created_description')}
            </p>

            <div className="flex justify-center mb-4">
                <QRCodeCanvas value={secretUrl} size={200} bgColor="#1e293b" fgColor="#ffffff" />
            </div>

            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                        {t('secret_settings.secret_url_label')}
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            readOnly
                            value={secretUrl}
                            className="w-full mt-1 pl-4 pr-10 py-2.5 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none"
                        />
                        <button
                            onClick={() => copyToClipboard(secretUrl, 'url')}
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                        >
                            {copied === 'url' ? (
                                <Check className="h-5 w-5 text-green-500" />
                            ) : (
                                <Copy className="h-5 w-5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white" />
                            )}
                        </button>
                    </div>
                </div>
                {password && (
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                            {t('secret_settings.password_label')}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                readOnly
                                value={password}
                                className="w-full mt-1 pl-4 pr-20 py-2.5 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                                <button onClick={() => copyToClipboard(password, 'password')}>
                                    {copied === 'password' ? (
                                        <Check className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <Copy className="h-5 w-5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                    onClick={resetSecret}
                    className="w-full sm:w-auto inline-flex items-center gap-2 justify-center bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white shadow-sm transition-all duration-150 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <Plus className="h-4 w-4" />
                    {t('secret_settings.create_new_secret_button')}
                </button>
                <div className="w-full sm:w-auto flex space-x-3">
                    <button
                        onClick={() => copyToClipboard(secretUrl, 'url')}
                        className="w-full sm:w-auto px-4 py-2 bg-teal-500 text-gray-900 dark:text-white text-sm"
                    >
                        {t('secret_settings.copy_url_button')}
                    </button>
                    <button
                        onClick={handleBurnSecret}
                        className="w-full sm:w-auto px-4 py-2 bg-red-500 text-gray-900 dark:text-white text-sm"
                    >
                        {t('secret_settings.burn_secret_button')}
                    </button>
                </div>
            </div>
            {instanceSettings?.maxSecretsPerUser && (
                <p className="text-gray-500 dark:text-slate-400 text-xs mt-3 text-center">
                    {t('secret_settings.max_secrets_per_user_info', {
                        count: instanceSettings.maxSecretsPerUser,
                    })}
                </p>
            )}
        </div>
    );
};
