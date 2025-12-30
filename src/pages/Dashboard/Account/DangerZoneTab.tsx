import { AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../components/Modal';
import { api } from '../../../lib/api';

export function DangerZoneTab() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleDeleteAccount = async () => {
        setIsLoading(true);
        try {
            const res = await api.account.$delete();
            if (res.ok) {
                navigate('/login');
            } else {
                console.error('Failed to delete account');
            }
        } catch (error) {
            console.error('An error occurred', error);
        } finally {
            setIsLoading(false);
            setIsDeleteModalOpen(false);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-dark-800 border border-red-500/30 p-4">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 bg-red-500/10">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {t('account_page.danger_zone.title')}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                            {t('account_page.danger_zone.description')}
                        </p>
                    </div>
                </div>

                <div className="p-3 bg-red-500/5 border border-red-500/20">
                    <h3 className="text-xs font-medium text-red-500 mb-1.5">
                        {t('account_page.danger_zone.delete_account_title')}
                    </h3>
                    <p className="text-xs text-red-400/80 mb-2">
                        {t('account_page.danger_zone.delete_account_description')}
                    </p>
                    <ul className="text-xs text-red-400/70 space-y-0.5 mb-3">
                        <li>• {t('account_page.danger_zone.delete_account_bullet1')}</li>
                        <li>• {t('account_page.danger_zone.delete_account_bullet2')}</li>
                        <li>• {t('account_page.danger_zone.delete_account_bullet3')}</li>
                        <li>• {t('account_page.danger_zone.delete_account_bullet4')}</li>
                    </ul>
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>
                            {isLoading
                                ? t('account_page.danger_zone.deleting_account_button')
                                : t('account_page.danger_zone.delete_account_button')}
                        </span>
                    </button>
                </div>
            </div>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteAccount}
                title={t('account_page.danger_zone.delete_account_title')}
                confirmText={t('account_page.danger_zone.delete_account_button')}
                cancelText={t('secrets_page.table.delete_cancel_button')}
            >
                <p>{t('account_page.danger_zone.delete_account_confirm')}</p>
            </Modal>
        </>
    );
}
