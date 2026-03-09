import { Check, Copy, Eye, EyeOff, Plus } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { useHemmeligStore } from '../store/hemmeligStore';
import { useSecretStore } from '../store/secretStore';
import { copyToClipboard as copyText } from '../utils/clipboard';
import { Card } from './Card';

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

    const handleCopyToClipboard = async (text: string, field: string) => {
        const success = await copyText(text);
        if (success) {
            setCopied(field);
        }
    };

    const handleBurnSecret = async () => {
        try {
            await api.secrets[':id'].$delete({ param: { id: secretId } });
            resetSecret();
        } catch (error) {
            console.error('Failed to burn secret:', error);
            toast.error(t('secret_settings.failed_to_burn'));
        }
    };

    return (
        <Card className="mt-6">
            {/* Success header */}
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 dark:bg-green-500/20 mb-4">
                    <Check className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('secret_settings.secret_created_title')}
                </h2>
                <p className="text-gray-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                    {t('secret_settings.secret_created_description')}
                </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
                <div className="p-4 bg-slate-800 dark:bg-dark-900 shadow-lg">
                    <QRCodeCanvas
                        value={secretUrl}
                        size={180}
                        bgColor="#1e293b"
                        fgColor="#ffffff"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                        {t('secret_settings.secret_url_label')}
                    </label>
                    <div className="relative group">
                        <input
                            type="text"
                            readOnly
                            value={secretUrl}
                            className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all duration-200 text-sm"
                        />
                        <button
                            onClick={() => handleCopyToClipboard(secretUrl, 'url')}
                            className="absolute inset-y-0 right-0 flex items-center pr-4 transition-transform duration-200 hover:scale-110"
                        >
                            {copied === 'url' ? (
                                <Check className="h-5 w-5 text-green-500" />
                            ) : (
                                <Copy className="h-5 w-5 text-gray-400 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400" />
                            )}
                        </button>
                    </div>
                </div>
                {password && (
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                            {t('secret_settings.password_label')}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                readOnly
                                value={password}
                                className="w-full pl-4 pr-24 py-3 bg-gray-50 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all duration-200 text-sm"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors duration-200"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleCopyToClipboard(password, 'password')}
                                    className="transition-transform duration-200 hover:scale-110"
                                >
                                    {copied === 'password' ? (
                                        <Check className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <Copy className="h-5 w-5 text-gray-400 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-600 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                    onClick={resetSecret}
                    className="w-full sm:w-auto inline-flex items-center gap-2 justify-center bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                    <Plus className="h-4 w-4" />
                    {t('secret_settings.create_new_secret_button')}
                </button>
                <div className="w-full sm:w-auto flex gap-3">
                    <button
                        onClick={() => handleCopyToClipboard(secretUrl, 'url')}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium transition-all duration-200 shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30"
                    >
                        {t('secret_settings.copy_url_button')}
                    </button>
                    <button
                        onClick={handleBurnSecret}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-red-500 hover:bg-red-400 text-white text-sm font-medium transition-all duration-200 shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30"
                    >
                        {t('secret_settings.burn_secret_button')}
                    </button>
                </div>
            </div>
            {instanceSettings?.maxSecretsPerUser && (
                <p className="text-gray-500 dark:text-slate-400 text-xs mt-4 text-center">
                    {t('secret_settings.max_secrets_per_user_info', {
                        count: instanceSettings.maxSecretsPerUser,
                    })}
                </p>
            )}
        </Card>
    );
};
