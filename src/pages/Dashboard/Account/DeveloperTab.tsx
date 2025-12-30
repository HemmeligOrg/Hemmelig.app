import { Check, Code, Copy, Key, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../components/Modal';
import { useCopyFeedbackWithId } from '../../../hooks/useCopyFeedback';
import { api } from '../../../lib/api';

interface ApiKey {
    id: string;
    name: string;
    keyPrefix: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
}

export function DeveloperTab() {
    const { t } = useTranslation();
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyExpiry, setNewKeyExpiry] = useState<number | undefined>(undefined);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
    const [apiKeyError, setApiKeyError] = useState('');
    const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { copiedId, copy: handleCopyToClipboard } = useCopyFeedbackWithId();

    const fetchApiKeys = async () => {
        try {
            const res = await api['api-keys'].$get();
            if (res.ok) {
                const data = await res.json();
                setApiKeys(data);
            }
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
        }
    };

    useEffect(() => {
        fetchApiKeys();
    }, []);

    const handleCreateApiKey = async () => {
        setApiKeyError('');
        if (!newKeyName.trim()) {
            setApiKeyError(t('account_page.developer.name_required'));
            return;
        }

        setIsLoading(true);
        try {
            const res = await api['api-keys'].$post({
                json: {
                    name: newKeyName,
                    expiresInDays: newKeyExpiry,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setNewlyCreatedKey(data.key);
                setNewKeyName('');
                setNewKeyExpiry(undefined);
                setIsCreateKeyModalOpen(false);
                fetchApiKeys();
            } else {
                const errorData = await res.json();
                setApiKeyError(errorData.error || t('account_page.developer.create_error'));
            }
        } catch (error) {
            console.error('Failed to create API key:', error);
            setApiKeyError(t('account_page.developer.create_error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteApiKey = async (id: string) => {
        try {
            const res = await api['api-keys'][':id'].$delete({ param: { id } });
            if (res.ok) {
                fetchApiKeys();
            }
        } catch (error) {
            console.error('Failed to delete API key:', error);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-purple-500/10">
                            <Code className="w-4 h-4 text-purple-500" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                {t('account_page.developer.title')}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                {t('account_page.developer.description')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCreateKeyModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('account_page.developer.create_key')}</span>
                    </button>
                </div>

                {newlyCreatedKey && (
                    <div className="mb-3 p-2.5 bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                            {t('account_page.developer.key_created')}
                        </p>
                        <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80 mb-2">
                            {t('account_page.developer.key_warning')}
                        </p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 p-1.5 bg-gray-900/50 dark:bg-dark-900 text-xs text-green-500 font-mono break-all">
                                {newlyCreatedKey}
                            </code>
                            <button
                                onClick={() => handleCopyToClipboard(newlyCreatedKey, 'new')}
                                className="p-1.5 bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors"
                            >
                                {copiedId === 'new' ? (
                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                                )}
                            </button>
                        </div>
                        <button
                            onClick={() => setNewlyCreatedKey(null)}
                            className="mt-1.5 text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
                        >
                            {t('account_page.developer.dismiss')}
                        </button>
                    </div>
                )}

                <div className="space-y-2">
                    {apiKeys.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 dark:text-slate-400">
                            <Key className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                            <p className="text-xs">{t('account_page.developer.no_keys')}</p>
                        </div>
                    ) : (
                        apiKeys.map((apiKey) => (
                            <div
                                key={apiKey.id}
                                className="p-2.5 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-900 dark:text-white">
                                            {apiKey.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                                            {apiKey.keyPrefix}...
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteApiKey(apiKey.id)}
                                        className="p-1.5 text-red-500 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                                    <span>
                                        {t('account_page.developer.created')}:{' '}
                                        {new Date(apiKey.createdAt).toLocaleDateString()}
                                    </span>
                                    {apiKey.lastUsedAt && (
                                        <span>
                                            {t('account_page.developer.last_used')}:{' '}
                                            {new Date(apiKey.lastUsedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                    {apiKey.expiresAt && (
                                        <span
                                            className={
                                                new Date(apiKey.expiresAt) < new Date()
                                                    ? 'text-red-500'
                                                    : ''
                                            }
                                        >
                                            {t('account_page.developer.expires')}:{' '}
                                            {new Date(apiKey.expiresAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-3 p-2.5 bg-gray-50 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-600">
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                        {t('account_page.developer.docs_hint')}{' '}
                        <a
                            href="/api/docs"
                            target="_blank"
                            className="text-teal-500 hover:underline"
                        >
                            {t('account_page.developer.api_docs')}
                        </a>
                    </p>
                </div>
            </div>

            <Modal
                isOpen={isCreateKeyModalOpen}
                onClose={() => {
                    setIsCreateKeyModalOpen(false);
                    setNewKeyName('');
                    setNewKeyExpiry(undefined);
                    setApiKeyError('');
                }}
                onConfirm={handleCreateApiKey}
                title={t('account_page.developer.create_key_title')}
                confirmText={t('account_page.developer.create_button')}
                cancelText={t('secrets_page.table.delete_cancel_button')}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">
                            {t('account_page.developer.key_name')}
                        </label>
                        <input
                            type="text"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            placeholder={t('account_page.developer.key_name_placeholder')}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">
                            {t('account_page.developer.expiration')}
                        </label>
                        <select
                            value={newKeyExpiry || ''}
                            onChange={(e) =>
                                setNewKeyExpiry(
                                    e.target.value ? parseInt(e.target.value) : undefined
                                )
                            }
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                        >
                            <option value="">{t('account_page.developer.never_expires')}</option>
                            <option value="30">
                                {t('account_page.developer.expires_30_days')}
                            </option>
                            <option value="90">
                                {t('account_page.developer.expires_90_days')}
                            </option>
                            <option value="365">
                                {t('account_page.developer.expires_1_year')}
                            </option>
                        </select>
                    </div>
                    {apiKeyError && <p className="text-xs text-red-500">{apiKeyError}</p>}
                </div>
            </Modal>
        </>
    );
}
