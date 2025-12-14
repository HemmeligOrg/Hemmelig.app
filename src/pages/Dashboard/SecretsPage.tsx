import { Eye, File as FileIcon, Lock, Plus, Shield, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLoaderData } from 'react-router-dom';
import { Modal } from '../../components/Modal';
import { api } from '../../lib/api';
import { formatDate, getTimeRemaining } from '../../utils/date';

interface Secret {
    id: string;
    createdAt: Date;
    expiresAt?: Date;
    views: number;
    isPasswordProtected: boolean;
    url: string;
    ipRange?: string;
    isBurnable: boolean;
    fileCount: number;
    isExpired?: boolean;
}

interface SecretsLoaderData {
    data: Secret[];
}

export function SecretsPage() {
    const rawData = useLoaderData() as SecretsLoaderData;
    const { t } = useTranslation();
    const [secrets, setSecrets] = useState<Secret[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [secretToDelete, setSecretToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (rawData?.data) {
            const now = new Date();
            setSecrets(
                rawData.data.map((secret) => {
                    const expiresAt = secret.expiresAt ? new Date(secret.expiresAt) : undefined;
                    return {
                        ...secret,
                        createdAt: new Date(secret.createdAt),
                        expiresAt,
                        url: `/secret/${secret.id}`,
                        isExpired: expiresAt ? expiresAt < now : false,
                    };
                })
            );
        }
    }, [rawData]);

    const openDeleteModal = (id: string) => {
        setSecretToDelete(id);
        setIsModalOpen(true);
    };

    const closeDeleteModal = () => {
        setSecretToDelete(null);
        setIsModalOpen(false);
    };

    const confirmDelete = async () => {
        if (secretToDelete) {
            try {
                await api.secrets[':id'].$delete({ param: { id: secretToDelete } });
                setSecrets(secrets.filter((secret) => secret.id !== secretToDelete));
                closeDeleteModal();
            } catch (error) {
                console.error('Failed to delete secret:', error);
            }
        }
    };

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="mb-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                            {t('secrets_page.title')}
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">
                            {t('secrets_page.description')}
                        </p>
                    </div>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors w-fit"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('secrets_page.create_secret_button')}</span>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 flex items-center justify-center bg-teal-500/10 text-teal-500">
                            <Shield className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {secrets.length}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                {t('secrets_page.total_secrets')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile: Card Layout */}
            <div className="sm:hidden space-y-2">
                {secrets.map((secret) => (
                    <div
                        key={secret.id}
                        className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-3"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 flex items-center justify-center bg-teal-500/10 text-teal-500">
                                    <Shield className="w-3.5 h-3.5" />
                                </div>
                                <span
                                    className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium ${
                                        secret.isExpired
                                            ? 'bg-red-500/10 text-red-500'
                                            : 'bg-green-500/10 text-green-500'
                                    }`}
                                >
                                    {secret.isExpired
                                        ? t('secrets_page.table.expired_status')
                                        : `${secret.views} ${t('secrets_page.table.views_left')}`}
                                </span>
                            </div>
                            <button
                                onClick={() => openDeleteModal(secret.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <p className="text-xs font-mono text-gray-700 dark:text-slate-300 truncate mb-2">
                            {secret.id}
                        </p>

                        <div className="flex items-center flex-wrap gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                            {secret.isPasswordProtected && (
                                <span className="flex items-center gap-1 bg-gray-100 dark:bg-dark-700 px-1.5 py-0.5">
                                    <Lock className="w-3 h-3" />
                                </span>
                            )}
                            {secret.fileCount > 0 && (
                                <span className="flex items-center gap-1 bg-gray-100 dark:bg-dark-700 px-1.5 py-0.5">
                                    <FileIcon className="w-3 h-3" />
                                    {secret.fileCount}
                                </span>
                            )}
                            <span className="flex items-center gap-1 bg-gray-100 dark:bg-dark-700 px-1.5 py-0.5">
                                <Eye className="w-3 h-3" />
                                {secret.views}
                            </span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-dark-600 text-xs text-gray-500 dark:text-slate-400">
                            <span>{formatDate(secret.createdAt)}</span>
                            <span className="mx-1.5">·</span>
                            <span>
                                {getTimeRemaining(secret.expiresAt) === 'Never expires'
                                    ? t('secrets_page.table.never_expires')
                                    : getTimeRemaining(secret.expiresAt) === 'Expired'
                                      ? t('secrets_page.table.expired_time')
                                      : getTimeRemaining(secret.expiresAt)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop: Table Layout */}
            <div className="hidden sm:block bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-dark-700/50 border-b border-gray-200 dark:border-dark-600">
                            <tr>
                                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-600 dark:text-slate-400">
                                    {t('secrets_page.table.secret_header')}
                                </th>
                                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-600 dark:text-slate-400">
                                    {t('secrets_page.table.created_header')}
                                </th>
                                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-600 dark:text-slate-400">
                                    {t('secrets_page.table.status_header')}
                                </th>
                                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-600 dark:text-slate-400 hidden lg:table-cell">
                                    {t('secrets_page.table.views_header')}
                                </th>
                                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-600 dark:text-slate-400">
                                    {t('secrets_page.table.actions_header')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-600">
                            {secrets.map((secret) => (
                                <tr
                                    key={secret.id}
                                    className="hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors"
                                >
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-teal-500/10 text-teal-500">
                                                <Shield className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                                    {secret.id}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {secret.isPasswordProtected && (
                                                        <Lock className="w-3 h-3 text-gray-400" />
                                                    )}
                                                    {secret.fileCount > 0 && (
                                                        <div className="flex items-center gap-0.5">
                                                            <FileIcon className="w-3 h-3 text-gray-400" />
                                                            <span className="text-xs text-gray-500">
                                                                {secret.fileCount}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-slate-400">
                                        {formatDate(secret.createdAt)}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div>
                                            <span
                                                className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium ${
                                                    secret.isExpired
                                                        ? 'bg-red-500/10 text-red-500'
                                                        : 'bg-green-500/10 text-green-500'
                                                }`}
                                            >
                                                {secret.isExpired
                                                    ? t('secrets_page.table.expired_status')
                                                    : `${secret.views} ${t('secrets_page.table.views_left')}`}
                                            </span>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                                {getTimeRemaining(secret.expiresAt) ===
                                                'Never expires'
                                                    ? t('secrets_page.table.never_expires')
                                                    : getTimeRemaining(secret.expiresAt) ===
                                                        'Expired'
                                                      ? t('secrets_page.table.expired_time')
                                                      : getTimeRemaining(secret.expiresAt)}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-slate-400 hidden lg:table-cell">
                                        <div className="flex items-center gap-1">
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>{secret.views}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <button
                                            onClick={() => openDeleteModal(secret.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                            title={t('secrets_page.table.delete_secret_tooltip')}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                title={t('secrets_page.table.delete_confirmation_title')}
                confirmText={t('secrets_page.table.delete_confirm_button')}
                cancelText={t('secrets_page.table.delete_cancel_button')}
            >
                <p>{t('secrets_page.table.delete_confirmation_text')}</p>
            </Modal>
        </div>
    );
}
