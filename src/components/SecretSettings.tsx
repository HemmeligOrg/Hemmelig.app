import React from 'react';

interface SecretSettingsProps {
    secretId: string;
    decryptionKey?: string;
}

export const SecretSettings: React.FC<SecretSettingsProps> = ({ secretId, decryptionKey }) => {
    const secretUrl = `${window.location.origin}/secret/${secretId}${decryptionKey ? `#decryptionKey=${decryptionKey}` : ''}`;

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">Secret Created!</h2>
            <p className="text-slate-400 mb-6">Your secret is now available at the following URL. Keep your decryption key safe, as it cannot be recovered.</p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300">Secret URL</label>
                    <input
                        type="text"
                        readOnly
                        value={secretUrl}
                        className="w-full mt-1 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none"
                    />
                </div>

                {decryptionKey && (
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Decryption Key</label>
                        <input
                            type="text"
                            readOnly
                            value={decryptionKey}
                            className="w-full mt-1 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none"
                        />
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-end space-x-4">
                <button className="px-4 py-2 bg-teal-500 text-white rounded-lg">Copy URL</button>
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg">Burn Secret</button>
            </div>
        </div>
    );
};
