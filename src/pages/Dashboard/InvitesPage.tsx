import { Copy, Plus, Ticket, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
import { toast } from 'sonner';
import { Modal } from '../../components/Modal';
import { api } from '../../lib/api';
import { copyToClipboard as copyText } from '../../utils/clipboard';

type InviteCode = {
    id: string;
    code: string;
    uses: number;
    maxUses: number | null;
    expiresAt: string | null;
    createdAt: string;
    isActive: boolean;
};

export function InvitesPage() {
    const { t } = useTranslation();
    const initialInvites = useLoaderData() as InviteCode[];
    const [invites, setInvites] = useState<InviteCode[]>(initialInvites || []);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [inviteToDelete, setInviteToDelete] = useState<InviteCode | null>(null);
    const [newInviteSettings, setNewInviteSettings] = useState({
        maxUses: 1,
        expiresInDays: 7,
    });

    const createInvite = async () => {
        try {
            const res = await api.invites.$post({
                json: newInviteSettings,
            });
            if (res.ok) {
                const newInvite = await res.json();
                setInvites([newInvite, ...invites]);
                setIsCreateModalOpen(false);
                toast.success(t('invites_page.toast.created'));
            }
        } catch (error) {
            console.error('Failed to create invite:', error);
            toast.error(t('invites_page.toast.create_error'));
        }
    };

    const deleteInvite = async () => {
        if (!inviteToDelete) return;
        try {
            const res = await api.invites[':id'].$delete({
                param: { id: inviteToDelete.id },
            });
            if (res.ok) {
                setInvites(invites.filter((i) => i.id !== inviteToDelete.id));
                setInviteToDelete(null);
                toast.success(t('invites_page.toast.deactivated'));
            }
        } catch (error) {
            console.error('Failed to delete invite:', error);
            toast.error(t('invites_page.toast.delete_error'));
        }
    };

    const handleCopyToClipboard = async (code: string) => {
        const success = await copyText(code);
        if (success) {
            toast.success(t('invites_page.toast.copied'));
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {t('invites_page.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">
                        {t('invites_page.description')}
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white transition-all duration-300 w-full sm:w-auto"
                >
                    <Plus className="w-4 h-4" />
                    <span>{t('invites_page.create_invite_button')}</span>
                </button>
            </div>

            <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                        <thead className="bg-gray-50 dark:bg-dark-800">
                            <tr>
                                <th
                                    scope="col"
                                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6"
                                >
                                    {t('invites_page.table.code_header')}
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                >
                                    {t('invites_page.table.uses_header')}
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white hidden sm:table-cell"
                                >
                                    {t('invites_page.table.expires_header')}
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                                >
                                    {t('invites_page.table.status_header')}
                                </th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                            {invites.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-8 text-center text-gray-500 dark:text-slate-400"
                                    >
                                        <Ticket className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>{t('invites_page.no_invites')}</p>
                                    </td>
                                </tr>
                            ) : (
                                invites.map((invite) => {
                                    const isExpired =
                                        invite.expiresAt && new Date(invite.expiresAt) < new Date();
                                    const isMaxedOut =
                                        invite.maxUses && invite.uses >= invite.maxUses;
                                    const isValid = invite.isActive && !isExpired && !isMaxedOut;

                                    return (
                                        <tr key={invite.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                <div className="flex items-center gap-2">
                                                    <code className="font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-dark-700 px-2 py-1">
                                                        {invite.code}
                                                    </code>
                                                    <button
                                                        onClick={() =>
                                                            handleCopyToClipboard(invite.code)
                                                        }
                                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-slate-400">
                                                {invite.uses} / {invite.maxUses ?? '∞'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-slate-400 hidden sm:table-cell">
                                                {invite.expiresAt
                                                    ? new Date(
                                                          invite.expiresAt
                                                      ).toLocaleDateString()
                                                    : t('invites_page.table.never')}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold ${
                                                        isValid
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-red-500/20 text-red-400'
                                                    }`}
                                                >
                                                    {isValid
                                                        ? t('invites_page.status.active')
                                                        : isExpired
                                                          ? t('invites_page.status.expired')
                                                          : isMaxedOut
                                                            ? t('invites_page.status.used')
                                                            : t('invites_page.status.inactive')}
                                                </span>
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button
                                                    onClick={() => setInviteToDelete(invite)}
                                                    disabled={!invite.isActive}
                                                    className="text-red-400 hover:text-red-300 disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onConfirm={createInvite}
                title={t('invites_page.create_modal.title')}
                confirmText={t('invites_page.create_invite_button')}
                cancelText={t('invites_page.delete_modal.cancel_text')}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                            {t('invites_page.create_modal.max_uses_label')}
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={newInviteSettings.maxUses}
                            onChange={(e) =>
                                setNewInviteSettings({
                                    ...newInviteSettings,
                                    maxUses: parseInt(e.target.value),
                                })
                            }
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                            {t('invites_page.create_modal.expires_in_label')}
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={365}
                            value={newInviteSettings.expiresInDays}
                            onChange={(e) =>
                                setNewInviteSettings({
                                    ...newInviteSettings,
                                    expiresInDays: parseInt(e.target.value),
                                })
                            }
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                        />
                    </div>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={!!inviteToDelete}
                onClose={() => setInviteToDelete(null)}
                onConfirm={deleteInvite}
                title={t('invites_page.delete_modal.title')}
                confirmText={t('invites_page.delete_modal.confirm_text')}
                cancelText={t('invites_page.delete_modal.cancel_text')}
            >
                <p className="text-gray-600 dark:text-slate-300">
                    {t('invites_page.delete_modal.message', { code: inviteToDelete?.code })}
                </p>
            </Modal>
        </div>
    );
}
