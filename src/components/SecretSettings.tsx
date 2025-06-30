import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react'
import { Copy, Check } from 'lucide-react';

interface SecretSettingsProps {
    secretId: string;
    decryptionKey?: string;
}

export const SecretSettings: React.FC<SecretSettingsProps> = ({ secretId, decryptionKey }) => {
    const secretUrl = `${window.location.origin}/secret/${secretId}${decryptionKey ? `#decryptionKey=${decryptionKey}` : ''}`;
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

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">Secret Created!</h2>
            <p className="text-slate-400 mb-6">Your secret is now available at the following URL. Keep your decryption key safe, as it cannot be recovered.</p>

            <div className="flex justify-center mb-6">
                <QRCodeCanvas value={secretUrl} size={256} bgColor="#1e293b" fgColor="#ffffff" />
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300">Secret URL</label>
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
                <div>
                    <label className="block text-sm font-medium text-slate-300">Decryption Key</label>
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
            </div>

            <div className="mt-6 flex justify-end space-x-4">
                <button onClick={() => copyToClipboard(secretUrl, 'url')} className="px-4 py-2 bg-teal-500 text-white rounded-lg">Copy URL</button>
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg">Burn Secret</button>
            </div>
        </div>
    );
};
