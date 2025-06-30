import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react'
import { Copy, Check, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { useSecretStore } from '../store/secretStore';
import { useTranslation } from 'react-i18next';

export const SecretSettings = () => {
    const { secretId, decryptionKey, password, resetSecret } = useSecretStore();
    const { t } = useTranslation();
    const secretUrl = `${window.location.origin}/secret/${secretId}${!password ? `#decryptionKey=${decryptionKey}` : ''}`;
    const [copied, setCopied] = useState<string | null>(null);

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
            console.error("Failed to burn secret:", error);
            alert("Failed to burn secret. Please try again.");
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">{t('secret_settings.secret_created_title')}</h2>
            <p className="text-slate-400 mb-6">{t('secret_settings.secret_created_description')}</p>

            <div className="flex justify-center mb-6">
                <QRCodeCanvas value={secretUrl} size={256} bgColor="#1e293b" fgColor="#ffffff" />
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300">{t('secret_settings.secret_url_label')}</label>
                    <div className="relative">
                        <input
                            type="text"
                            readOnly
                            value={secretUrl}
                            className="w-full mt-1 pl-4 pr-10 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none"
                        />
                        <button onClick={() => copyToClipboard(secretUrl, 'url')} className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {copied === 'url' ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-slate-400 hover:text-white" />}
                        </button>
                    </div>
                </div>
                {!password && (
                    <div>
                        <label className="block text-sm font-medium text-slate-300">{t('secret_settings.decryption_key_label')}</label>
                        <div className="relative">
                            <input
                                type="text"
                                readOnly
                                value={decryptionKey}
                                className="w-full mt-1 pl-4 pr-10 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none"
                            />
                            <button onClick={() => copyToClipboard(decryptionKey, 'key')} className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {copied === 'key' ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-slate-400 hover:text-white" />}
                            </button>
                        </div>
                    </div>
                )}
                {password && (
                    <div>
                        <label className="block text-sm font-medium text-slate-300">{t('secret_settings.password_label')}</label>
                        <div className="relative">
                            <input
                                type="text"
                                readOnly
                                value={password}
                                className="w-full mt-1 pl-4 pr-10 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none"
                            />
                            <button onClick={() => copyToClipboard(password, 'password')} className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {copied === 'password' ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-slate-400 hover:text-white" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 flex items-center justify-between">
                <button
                    onClick={resetSecret}
                    className="inline-flex items-center gap-2 justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <Plus className="h-5 w-5" />
                    {t('secret_settings.create_new_secret_button')}
                </button>
                <div className="flex space-x-4">
                    <button onClick={() => copyToClipboard(secretUrl, 'url')} className="px-4 py-2 bg-teal-500 text-white rounded-lg">{t('secret_settings.copy_url_button')}</button>
                    <button onClick={handleBurnSecret} className="px-4 py-2 bg-red-500 text-white rounded-lg">{t('secret_settings.burn_secret_button')}</button>
                </div>
            </div>
        </div>
    );
};
