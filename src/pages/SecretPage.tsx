import { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation, useLoaderData, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { decrypt, generateEncryptionKey, decryptFile } from '../lib/crypto';
import { Loader2, Eye, Lock, LockOpen, File as FileIcon, Download, Copy, Check, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import Editor from '../components/Editor';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';

interface SecretFile {
  id: string;
  filename: string;
}

interface SecretLoaderData {
  isPasswordProtected: boolean;
  views: number;
  files: SecretFile[];
}

export function SecretPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const initialData = useLoaderData() as SecretLoaderData;
  const [secretContent, setSecretContent] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [files, setFiles] = useState<SecretFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [showSecretContent, setShowSecretContent] = useState(false);
  const [viewsRemaining, setViewsRemaining] = useState<number | null>(null);
  const [salt, setSalt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const decryptionKey = location.hash.startsWith('#decryptionKey=') 
    ? location.hash.substring('#decryptionKey='.length) 
    : '';

  const fetchSecretContent = useCallback(async (password: string) => {
    setIsLoading(true);
    try {
      const finalDecryptionKey = password ? generateEncryptionKey(password) : decryptionKey;
      const response = await api.secrets[':id'].$post({ param: { id: id! }, json: { password: finalDecryptionKey } });
      const data = await response.json();

      if (response.status === 200 && data.secret) {
        const decryptedSecret = await decrypt(new Uint8Array(Object.values(data.secret)), finalDecryptionKey, data.salt);
        const decryptedTitle = data.title ? await decrypt(new Uint8Array(Object.values(data.title)), finalDecryptionKey, data.salt) : null;
        setSecretContent(decryptedSecret);
        setTitle(decryptedTitle);
        setFiles(data.files);
        setSalt(data.salt);
        setShowSecretContent(true);
        setViewsRemaining(prev => (prev !== null ? prev - 1 : null));
      }
    } catch (err: unknown) {
      console.error('Error fetching secret:', err);
    } finally {
      setIsLoading(false);
    }
  }, [decryptionKey, id]);

  useEffect(() => {
    if (initialData) {
      setIsPasswordProtected(initialData.isPasswordProtected);
      setViewsRemaining(initialData.views);
      setFiles(initialData.files);
    }
  }, [initialData]);

  const handleViewSecret = () => {
    fetchSecretContent(passwordInput);
  };

  const handleDownload = async (file: SecretFile) => {
    const finalDecryptionKey = passwordInput ? generateEncryptionKey(passwordInput) : decryptionKey;
    const response = await api.files[':id'].$get({ param: { id: file.id } });
    const encryptedFile = await response.arrayBuffer();
    const decryptedFile = await decryptFile(new Uint8Array(encryptedFile), finalDecryptionKey, salt!);
    const blob = new Blob([decryptedFile]);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.filename.split('-').slice(1).join('-');
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secretContent || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteSecret = async () => {
    setIsDeleting(true);
    try {
      const response = await api.secrets[':id'].$delete({ param: { id: id! } });
      if (response.ok) {
        navigate('/');
      }
    } catch (err) {
      console.error('Error deleting secret:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <main className="py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-teal-500 mb-4" />
          <p className="text-gray-500 dark:text-slate-400">{t('secret_page.loading_message')}</p>
        </div>
      </main>
    );
  }

  // Pre-reveal state (view secret button)
  if (!showSecretContent) {
    return (
      <main className="py-8">
        <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-600">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              <span className="font-medium text-gray-900 dark:text-white">
                {t('secret_page.encrypted_secret')}
              </span>
            </div>
            {viewsRemaining !== null && (
              <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {viewsRemaining}
              </span>
            )}
          </div>

          {/* Blurred content preview with overlay */}
          <div className="relative">
            {/* Fake blurred content */}
            <div className="p-4 sm:p-6 select-none pointer-events-none" aria-hidden="true">
              <div className="blur-sm opacity-50 space-y-3">
                <div className="h-4 bg-gray-300 dark:bg-dark-600 w-3/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-dark-600 w-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-dark-600 w-5/6"></div>
                <div className="h-4 bg-gray-300 dark:bg-dark-600 w-2/3"></div>
                <div className="h-4 bg-gray-300 dark:bg-dark-600 w-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-dark-600 w-4/5"></div>
                <div className="h-4 bg-gray-300 dark:bg-dark-600 w-1/2"></div>
              </div>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-white/80 dark:bg-dark-800/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6">
              {isPasswordProtected && (
                <div className="w-full max-w-xs mb-4">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleViewSecret()}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700 border border-gray-300 dark:border-dark-500 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-center"
                    placeholder={t('secret_page.password_placeholder')}
                    autoFocus
                  />
                </div>
              )}
              
              <button
                onClick={handleViewSecret}
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium transition-colors"
              >
                <LockOpen className="w-5 h-5" />
                {t('secret_page.unlock_secret')}
              </button>

              <p className="text-xs text-gray-500 dark:text-slate-400 mt-4 text-center">
                {viewsRemaining === 1 
                  ? t('secret_page.one_view_remaining')
                  : t('secret_page.views_remaining', { count: viewsRemaining })
                }
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Secret revealed state
  return (
    <main className="py-8">
      <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-600">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              {title || t('secret_page.secret_revealed')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {viewsRemaining !== null && viewsRemaining > 0 && (
              <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {viewsRemaining}
              </span>
            )}
            <button
              onClick={copyToClipboard}
              className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title={t('secret_page.copy_secret')}
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <Editor value={secretContent || ''} editable={false} />

          {/* Files */}
          {files && files.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-600">
              <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-3">
                {t('secret_page.files_title')} ({files.length})
              </h3>
              <div className="space-y-2">
                {files.map(file => (
                  <div 
                    key={file.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/30 border border-gray-200 dark:border-dark-500/30 hover:border-teal-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileIcon className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                      <span className="text-sm text-gray-700 dark:text-slate-300">
                        {file.filename.split('-').slice(1).join('-')}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDownload(file)} 
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {t('secret_page.download')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700/30 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('secret_page.create_your_own')}
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {t('secret_page.delete_secret')}
          </button>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('secret_page.delete_modal_title')}
        confirmText={isDeleting ? t('common.deleting') : t('common.delete')}
        cancelText={t('common.cancel')}
        onConfirm={handleDeleteSecret}
      >
        <p>{t('secret_page.delete_modal_message')}</p>
      </Modal>
    </main>
  );
}
