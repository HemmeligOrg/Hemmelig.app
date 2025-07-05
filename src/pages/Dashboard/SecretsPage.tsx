import { useState, useEffect } from 'react';
import {
    Shield,
    Eye,
    Trash2,
    Plus,
    Lock
} from 'lucide-react';
import { Link, useLoaderData } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { Modal } from '../../components/Modal';

interface Secret {
    id: string;
    createdAt: Date;
    expiresAt?: Date;
    views: number;
    isPasswordProtected: boolean;
    url: string;
    ipRange?: string;
    isBurnable: boolean;
}

import { formatDate, getTimeRemaining } from '../../utils/date';

export function SecretsPage() {
    const rawData = useLoaderData() as { data: Secret[] };
    const { t } = useTranslation();
    const [secrets, setSecrets] = useState<Secret[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [secretToDelete, setSecretToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (rawData && rawData.data) {
            setSecrets(rawData.data.map((secret: Secret) => ({
                id: secret.id,
                createdAt: new Date(secret.createdAt),
                expiresAt: secret.expiresAt ? new Date(secret.expiresAt) : undefined,
                views: secret.views,
                isPasswordProtected: secret.isPasswordProtected,
                url: `/secret/${secret.id}`,
                ipRange: secret.ipRange,
                isBurnable: secret.isBurnable,
            })));
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
                setSecrets(secrets.filter(secret => secret.id !== secretToDelete));
                closeDeleteModal();
            } catch (error) {
                console.error("Failed to delete secret:", error);
            }
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('secrets_page.title')}</h1>
                        <p className="text-slate-400 mt-1">{t('secrets_page.description')}</p>
                    </div>
                    <Link
                        to="/"
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg transition-all duration-300 hover:scale-105 w-fit"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t('secrets_page.create_secret_button')}</span>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-teal-500/20 rounded-lg">
                            <Shield className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{secrets.length}</p>
                            <p className="text-sm text-slate-400">{t('secrets_page.total_secrets')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secrets List */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-700/30 border-b border-slate-600/50">
                            <tr>
                                <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-slate-300">{t('secrets_page.table.secret_header')}</th>
                                <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-slate-300 hidden sm:table-cell">{t('secrets_page.table.created_header')}</th>
                                <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-slate-300">{t('secrets_page.table.status_header')}</th>
                                <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-slate-300 hidden lg:table-cell">{t('secrets_page.table.views_header')}</th>
                                <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-slate-300">{t('secrets_page.table.actions_header')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-600/30">
                            {secrets.map((secret) => (
                                <tr key={secret.id} className="hover:bg-slate-700/20 transition-colors duration-200">
                                    <td className="px-4 sm:px-6 py-4">
                                        <div className="flex items-start space-x-3">
                                            <div className='p-2 rounded-lg flex-shrink-0 bg-teal-500/20'>
                                                <Shield className='text-teal-400' />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {secret.id}
                                                </p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    {secret.isPasswordProtected && (
                                                        <Lock className="w-3 h-3 text-slate-400" />
                                                    )}
                                                    <p className="text-xs text-slate-400 truncate">
                                                        {secret.url}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-sm text-slate-400 hidden sm:table-cell">
                                        {formatDate(secret.createdAt)}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4">
                                        <div className="space-y-1">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${secret.isExpired
                                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                }`}>
                                                {secret.isExpired ? t('secrets_page.table.expired_status') : `${secret.views} ${t('secrets_page.table.views_left')}`}
                                            </span>
                                            <p className="text-xs text-slate-400">
                                                {getTimeRemaining(secret.expiresAt) === 'Never expires' ? t('secrets_page.table.never_expires') : getTimeRemaining(secret.expiresAt) === 'Expired' ? t('secrets_page.table.expired_time') : getTimeRemaining(secret.expiresAt)}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-sm text-slate-400 hidden lg:table-cell">
                                        <div className="flex items-center space-x-2">
                                            <Eye className="w-4 h-4" />
                                            <span>{secret.views}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => openDeleteModal(secret.id)}
                                                className="p-2 text-slate-400 hover:text-red-400 transition-colors duration-200"
                                                title={t('secrets_page.table.delete_secret_tooltip')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
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
        </div >
    );
}
