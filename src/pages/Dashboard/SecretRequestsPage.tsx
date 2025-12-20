import { Copy, ExternalLink, Link2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Modal } from '../../components/Modal';
import { api } from '../../lib/api';
import { copyToClipboard as copyText } from '../../utils/clipboard';

type SecretRequest = {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'fulfilled' | 'expired' | 'cancelled';
    maxViews: number;
    expiresIn: number;
    webhookUrl?: string;
    createdAt: string;
    expiresAt: string;
    fulfilledAt?: string;
    secretId?: string;
};

type LoaderData = {
    data: SecretRequest[];
    meta: {
        total: number;
        page: number;
        totalPages: number;
    };
};

export function SecretRequestsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const loaderData = useLoaderData() as LoaderData;
    const [requests, setRequests] = useState<SecretRequest[]>(loaderData?.data || []);
    const [requestToCancel, setRequestToCancel] = useState<SecretRequest | null>(null);
    const [requestToView, setRequestToView] = useState<SecretRequest | null>(null);
    const [creatorLink, setCreatorLink] = useState<string | null>(null);

    const fetchCreatorLink = async (request: SecretRequest) => {
        try {
            const res = await api['secret-requests'][':id'].$get({ param: { id: request.id } });
            if (res.ok) {
                const data = await res.json();
                setCreatorLink(data.creatorLink || null);
                setRequestToView(request);
            }
        } catch (error) {
            console.error('Failed to fetch creator link:', error);
            toast.error(t('secret_requests_page.toast.fetch_error'));
        }
    };

    const cancelRequest = async () => {
        if (!requestToCancel) return;
        try {
            const res = await api['secret-requests'][':id'].$delete({
                param: { id: requestToCancel.id },
            });
            if (res.ok) {
                setRequests(
                    requests.map((r) =>
                        r.id === requestToCancel.id ? { ...r, status: 'cancelled' as const } : r
                    )
                );
                setRequestToCancel(null);
                toast.success(t('secret_requests_page.toast.cancelled'));
            }
        } catch (error) {
            console.error('Failed to cancel request:', error);
            toast.error(t('secret_requests_page.toast.cancel_error'));
        }
    };

    const handleCopyToClipboard = async (text: string) => {
        const success = await copyText(text);
        if (success) {
            toast.success(t('secret_requests_page.toast.copied'));
        }
    };

    const getStatusColor = (status: SecretRequest['status']) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-400';
            case 'fulfilled':
                return 'bg-green-500/20 text-green-400';
            case 'expired':
                return 'bg-gray-500/20 text-gray-400';
            case 'cancelled':
                return 'bg-red-500/20 text-red-400';
            default:
                return 'bg-gray-500/20 text-gray-400';
        }
    };

    const formatExpiration = (seconds: number) => {
        if (seconds >= 86400) {
            const days = Math.floor(seconds / 86400);
            return t('secret_requests_page.time.days', { count: days });
        } else if (seconds >= 3600) {
            const hours = Math.floor(seconds / 3600);
            return t('secret_requests_page.time.hours', { count: hours });
        } else {
            const minutes = Math.floor(seconds / 60);
            return t('secret_requests_page.time.minutes', { count: minutes });
        }
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="mb-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                        {t('secret_requests_page.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">
                        {t('secret_requests_page.description')}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/dashboard/secret-requests/create')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors w-fit"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('secret_requests_page.create_request_button')}</span>
                </button>
            </div>

            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                        <thead className="bg-gray-50 dark:bg-dark-700/50">
                            <tr>
                                <th
                                    scope="col"
                                    className="py-2.5 pl-4 pr-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 sm:pl-4"
                                >
                                    {t('secret_requests_page.table.title_header')}
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 dark:text-slate-400"
                                >
                                    {t('secret_requests_page.table.status_header')}
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 dark:text-slate-400 hidden sm:table-cell"
                                >
                                    {t('secret_requests_page.table.secret_expiry_header')}
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 dark:text-slate-400 hidden md:table-cell"
                                >
                                    {t('secret_requests_page.table.link_expires_header')}
                                </th>
                                <th scope="col" className="relative py-2.5 pl-3 pr-4 sm:pr-4">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-600">
                            {requests.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-6 text-center text-gray-500 dark:text-slate-400"
                                    >
                                        <Link2 className="w-8 h-8 mx-auto mb-1.5 opacity-50" />
                                        <p className="text-xs">
                                            {t('secret_requests_page.no_requests')}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((request) => {
                                    const isExpired = new Date(request.expiresAt) < new Date();
                                    const isPending = request.status === 'pending' && !isExpired;

                                    return (
                                        <tr
                                            key={request.id}
                                            className="hover:bg-gray-50 dark:hover:bg-dark-700/30"
                                        >
                                            <td className="whitespace-nowrap py-2.5 pl-4 pr-3 text-xs sm:pl-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {request.title}
                                                    </span>
                                                    {request.description && (
                                                        <span className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-[180px]">
                                                            {request.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-xs">
                                                <span
                                                    className={`px-1.5 py-0.5 inline-flex text-xs font-medium ${getStatusColor(isExpired && request.status === 'pending' ? 'expired' : request.status)}`}
                                                >
                                                    {t(
                                                        `secret_requests_page.status.${isExpired && request.status === 'pending' ? 'expired' : request.status}`
                                                    )}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-xs text-gray-500 dark:text-slate-400 hidden sm:table-cell">
                                                {formatExpiration(request.expiresIn)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-xs text-gray-500 dark:text-slate-400 hidden md:table-cell">
                                                {new Date(request.expiresAt).toLocaleDateString()}
                                            </td>
                                            <td className="relative whitespace-nowrap py-2.5 pl-3 pr-4 text-right sm:pr-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    {request.status === 'fulfilled' &&
                                                        request.secretId && (
                                                            <a
                                                                href={`/secret/${request.secretId}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1.5 text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors"
                                                                title={t(
                                                                    'secret_requests_page.table.view_secret_tooltip'
                                                                )}
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </a>
                                                        )}
                                                    {isPending && (
                                                        <button
                                                            onClick={() =>
                                                                fetchCreatorLink(request)
                                                            }
                                                            className="p-1.5 text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors"
                                                            title={t(
                                                                'secret_requests_page.table.copy_link_tooltip'
                                                            )}
                                                        >
                                                            <Copy className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {isPending && (
                                                        <button
                                                            onClick={() =>
                                                                setRequestToCancel(request)
                                                            }
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                            title={t(
                                                                'secret_requests_page.table.cancel_tooltip'
                                                            )}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Creator Link Modal */}
            <Modal
                isOpen={!!requestToView}
                onClose={() => {
                    setRequestToView(null);
                    setCreatorLink(null);
                }}
                onConfirm={() => {
                    if (creatorLink) handleCopyToClipboard(creatorLink);
                }}
                title={t('secret_requests_page.link_modal.title')}
                confirmText={t('secret_requests_page.link_modal.copy_button')}
                cancelText={t('secret_requests_page.link_modal.close_button')}
            >
                <div className="space-y-3">
                    <p className="text-xs text-gray-600 dark:text-slate-300">
                        {t('secret_requests_page.link_modal.description')}
                    </p>
                    {creatorLink && (
                        <div className="bg-gray-50 dark:bg-dark-700 p-2.5 break-all">
                            <code className="text-xs text-gray-900 dark:text-white">
                                {creatorLink}
                            </code>
                        </div>
                    )}
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        {t('secret_requests_page.link_modal.warning')}
                    </p>
                </div>
            </Modal>

            {/* Cancel Request Modal */}
            <Modal
                isOpen={!!requestToCancel}
                onClose={() => setRequestToCancel(null)}
                onConfirm={cancelRequest}
                title={t('secret_requests_page.cancel_modal.title')}
                confirmText={t('secret_requests_page.cancel_modal.confirm_text')}
                cancelText={t('secret_requests_page.cancel_modal.cancel_text')}
            >
                <p className="text-xs text-gray-600 dark:text-slate-300">
                    {t('secret_requests_page.cancel_modal.message', {
                        title: requestToCancel?.title,
                    })}
                </p>
            </Modal>
        </div>
    );
}
