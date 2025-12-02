import { useState, useEffect } from 'react';
import {
  Shield,
  Eye,
  Trash2,
  Plus,
  Lock,
  File as FileIcon
} from 'lucide-react';
import { Link, useLoaderData } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { Modal } from '../../components/Modal';
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
      setSecrets(rawData.data.map((secret) => {
        const expiresAt = secret.expiresAt ? new Date(secret.expiresAt) : undefined;
        return {
          ...secret,
          createdAt: new Date(secret.createdAt),
          expiresAt,
          url: `/secret/${secret.id}`,
          isExpired: expiresAt ? expiresAt < now : false,
        };
      }));
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
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('secrets_page.title')}</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{t('secrets_page.description')}</p>
          </div>
          <Link
            to="/"
            className="flex items-center space-x-2 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm transition-all duration-300 w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>{t('secrets_page.create_secret_button')}</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-500/20">
              <Shield className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{secrets.length}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{t('secrets_page.total_secrets')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Card Layout */}
      <div className="sm:hidden space-y-3">
        {secrets.map((secret) => (
          <div key={secret.id} className="bg-white dark:bg-dark-800/80 border border-gray-200 dark:border-dark-600 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-teal-400" />
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${secret.isExpired
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                  {secret.isExpired ? t('secrets_page.table.expired_status') : `${secret.views} ${t('secrets_page.table.views_left')}`}
                </span>
              </div>
              <button
                onClick={() => openDeleteModal(secret.id)}
                className="p-2 text-gray-500 dark:text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm font-mono text-gray-700 dark:text-slate-300 truncate mb-2">
              {secret.id}
            </p>
            
            <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 dark:text-slate-400">
              {secret.isPasswordProtected && (
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  {t('secrets_page.password_protected')}
                </span>
              )}
              {secret.fileCount > 0 && (
                <span className="flex items-center gap-1">
                  <FileIcon className="w-3 h-3" />
                  {secret.fileCount} {t('secrets_page.files')}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {secret.views}
              </span>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-dark-600 text-xs text-gray-500 dark:text-slate-400">
              <span>{formatDate(secret.createdAt)}</span>
              <span className="mx-2">·</span>
              <span>{getTimeRemaining(secret.expiresAt) === 'Never expires' ? t('secrets_page.table.never_expires') : getTimeRemaining(secret.expiresAt) === 'Expired' ? t('secrets_page.table.expired_time') : getTimeRemaining(secret.expiresAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden sm:block bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-700/30 border-b border-gray-300 dark:border-dark-500/50">
              <tr>
                <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-gray-600 dark:text-slate-300">{t('secrets_page.table.secret_header')}</th>
                <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-gray-600 dark:text-slate-300">{t('secrets_page.table.created_header')}</th>
                <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-gray-600 dark:text-slate-300">{t('secrets_page.table.status_header')}</th>
                <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-gray-600 dark:text-slate-300 hidden lg:table-cell">{t('secrets_page.table.views_header')}</th>
                <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-gray-600 dark:text-slate-300">{t('secrets_page.table.actions_header')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-500/30">
              {secrets.map((secret) => (
                <tr key={secret.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/20 transition-colors duration-200">
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex items-start space-x-3">
                      <div className='p-2 flex-shrink-0 bg-teal-500/20'>
                        <Shield className='text-teal-400 w-4 h-4' />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {secret.id}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {secret.isPasswordProtected && (
                            <Lock className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                          )}
                          {secret.fileCount > 0 && (
                            <div className="flex items-center space-x-1">
                              <FileIcon className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                              <span className="text-xs text-gray-500 dark:text-slate-400">{secret.fileCount}</span>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                            {secret.url}
                          </p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
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
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {getTimeRemaining(secret.expiresAt) === 'Never expires' ? t('secrets_page.table.never_expires') : getTimeRemaining(secret.expiresAt) === 'Expired' ? t('secrets_page.table.expired_time') : getTimeRemaining(secret.expiresAt)}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 dark:text-slate-400 hidden lg:table-cell">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>{secret.views}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openDeleteModal(secret.id)}
                        className="p-2 text-gray-500 dark:text-slate-400 hover:text-red-400 transition-colors duration-200"
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
