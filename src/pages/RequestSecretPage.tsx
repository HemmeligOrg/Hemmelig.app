import { Copy, Lock, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import Editor from '../components/Editor';
import { TitleField } from '../components/TitleField';
import { api } from '../lib/api';
import { encrypt, generateEncryptionKey, generateSalt } from '../lib/crypto';
import { copyToClipboard as copyText } from '../utils/clipboard';

interface RequestInfo {
    id: string;
    title: string;
    description?: string;
}

interface CreatedSecret {
    secretId: string;
    viewUrl: string;
}

export function RequestSecretPage() {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [secret, setSecret] = useState('');
    const [title, setTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdSecret, setCreatedSecret] = useState<CreatedSecret | null>(null);

    useEffect(() => {
        const fetchRequestInfo = async () => {
            if (!id || !token) {
                setError(t('request_secret_page.error.invalid_link'));
                setIsLoading(false);
                return;
            }

            try {
                const res = await api['secret-requests'][':id'].info.$get({
                    param: { id },
                    query: { token },
                });

                if (res.ok) {
                    const data = await res.json();
                    setRequestInfo(data);
                } else if (res.status === 410) {
                    setError(t('request_secret_page.error.already_fulfilled'));
                } else if (res.status === 404) {
                    setError(t('request_secret_page.error.not_found'));
                } else {
                    setError(t('request_secret_page.error.generic'));
                }
            } catch (err) {
                console.error('Failed to fetch request info:', err);
                setError(t('request_secret_page.error.generic'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequestInfo();
    }, [id, token, t]);

    const handleSubmit = async () => {
        if (!id || !token || !secret.trim()) return;

        setIsSubmitting(true);

        let encryptionKey = '';
        try {
            // Generate encryption key and salt client-side
            encryptionKey = generateEncryptionKey();
            const salt = generateSalt();

            // Encrypt the secret and title
            const encryptedSecret = await encrypt(secret, encryptionKey, salt);
            const encryptedTitle = title ? await encrypt(title, encryptionKey, salt) : null;

            // Submit to backend
            const res = await api['secret-requests'][':id'].submit.$post({
                param: { id },
                query: { token },
                json: {
                    secret: encryptedSecret,
                    title: encryptedTitle,
                    salt,
                },
            });

            if (res.ok) {
                const data = await res.json();
                // Construct the view URL with the decryption key in the fragment
                const viewUrl = `${window.location.origin}/secret/${data.secretId}#decryptionKey=${encryptionKey}`;

                // Clear sensitive data from state
                setSecret('');
                setTitle('');

                setCreatedSecret({
                    secretId: data.secretId,
                    viewUrl,
                });
                toast.success(t('request_secret_page.toast.created'));
            } else if (res.status === 410) {
                setError(t('request_secret_page.error.already_fulfilled'));
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || t('request_secret_page.toast.create_error'));
            }
        } catch (err) {
            console.error('Failed to submit secret:', err);
            toast.error(t('request_secret_page.toast.create_error'));
        } finally {
            setIsSubmitting(false);
            // Clear encryption key from memory
            encryptionKey = '';
        }
    };

    const handleCopyToClipboard = async (text: string) => {
        const success = await copyText(text);
        if (success) {
            toast.success(t('request_secret_page.toast.copied'));
        }
    };

    if (isLoading) {
        return (
            <div className="py-12 flex justify-center">
                <div className="text-gray-500 dark:text-slate-400">
                    {t('request_secret_page.loading')}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-12">
                <div className="max-w-lg mx-auto text-center">
                    <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-8">
                        <Lock className="w-12 h-12 mx-auto mb-4 text-red-400" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {t('request_secret_page.error.title')}
                        </h2>
                        <p className="text-gray-500 dark:text-slate-400 mb-6">{error}</p>
                        <Link
                            to="/"
                            className="inline-block px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                        >
                            {t('request_secret_page.error.go_home_button')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (createdSecret) {
        return (
            <div className="py-12">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-6 sm:p-8">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
                                <Send className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {t('request_secret_page.success.title')}
                            </h2>
                            <p className="text-gray-500 dark:text-slate-400">
                                {t('request_secret_page.success.description')}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                    {t('request_secret_page.success.view_url_label')}
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-100 dark:bg-dark-700 p-3 overflow-x-auto">
                                        <code className="text-sm text-gray-900 dark:text-white break-all">
                                            {createdSecret.viewUrl}
                                        </code>
                                    </div>
                                    <button
                                        onClick={() => handleCopyToClipboard(createdSecret.viewUrl)}
                                        className="p-3 bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4">
                                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                    {t('request_secret_page.success.warning')}
                                </p>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {t('request_secret_page.success.manual_send_note')}
                            </p>

                            <div className="pt-4">
                                <Link
                                    to="/"
                                    className="block w-full px-4 py-3 bg-gray-200 dark:bg-dark-600 hover:bg-gray-300 dark:hover:bg-dark-500 text-gray-900 dark:text-white text-center transition-colors"
                                >
                                    {t('request_secret_page.success.create_own_button')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-6 sm:py-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-6 sm:p-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {t('request_secret_page.form.title')}
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400">
                            {t('request_secret_page.form.description')}
                        </p>
                    </div>

                    {requestInfo && (
                        <div className="bg-gray-50 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-600 p-4 mb-6">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                                {requestInfo.title}
                            </h3>
                            {requestInfo.description && (
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    {requestInfo.description}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="relative">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500" />
                            <div className="pt-4">
                                <Editor value={secret} onChange={setSecret} />
                            </div>
                        </div>

                        <TitleField value={title} onChange={setTitle} />

                        <div className="bg-blue-500/10 border border-blue-500/30 p-4">
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                {t('request_secret_page.form.encryption_note')}
                            </p>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !secret.trim()}
                            className="w-full px-4 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center space-x-2"
                        >
                            {isSubmitting ? (
                                <span>{t('request_secret_page.form.submitting_button')}</span>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>{t('request_secret_page.form.submit_button')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
