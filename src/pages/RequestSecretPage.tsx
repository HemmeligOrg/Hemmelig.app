import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, buttonClassName } from '../components/Button';
import Editor from '../components/Editor';
import { useCopyFeedback } from '../hooks/useCopyFeedback';
import { api } from '../lib/api';
import { encrypt, generateEncryptionKey, generateSalt } from '../lib/crypto';

interface RequestInfo {
    id: string;
    title: string;
    description?: string | null;
}

interface CreatedSecret {
    secretId: string;
    decryptionKey: string;
}

export function RequestSecretPage() {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const location = useLocation();

    // New links carry the token in the URL fragment, which browsers never send
    // to the server. Query tokens are only read for legacy links.
    const legacyToken = searchParams.get('token');
    const fragmentToken = location.hash.startsWith('#token=')
        ? location.hash.slice('#token='.length)
        : null;
    const token = fragmentToken || legacyToken;

    const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [secret, setSecret] = useState('');
    const [title, setTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdSecret, setCreatedSecret] = useState<CreatedSecret | null>(null);
    const { copied, copy } = useCopyFeedback();

    useEffect(() => {
        const fetchRequestInfo = async () => {
            if (!id || !token) {
                setError(t('request_secret_page.error.invalid_link'));
                setIsLoading(false);
                return;
            }

            try {
                const res = await api['secret-requests'][':id'].info.$get(
                    { param: { id }, query: legacyToken ? { token: legacyToken } : {} },
                    token ? { headers: { 'x-secret-request-token': token } } : {}
                );

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
    }, [id, legacyToken, token, t]);

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
            const res = await api['secret-requests'][':id'].submit.$post(
                {
                    param: { id },
                    query: legacyToken ? { token: legacyToken } : {},
                    json: {
                        secret: encryptedSecret,
                        title: encryptedTitle,
                        salt,
                    },
                },
                token ? { headers: { 'x-secret-request-token': token } } : {}
            );

            if (res.ok) {
                // Clear sensitive data from state
                setSecret('');
                setTitle('');

                setCreatedSecret({
                    secretId: '',
                    decryptionKey: encryptionKey,
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

    const kicker = (
        <div className="font-mono text-ui text-accent">{t('request_secret_page.kicker')}</div>
    );

    if (isLoading) {
        return (
            <main className="max-w-content mx-auto px-6 py-24 text-center font-mono text-ui text-muted">
                {t('request_secret_page.loading')}
            </main>
        );
    }

    if (error) {
        return (
            <main className="max-w-reading mx-auto px-6 py-28 grid gap-4.5">
                <div className="font-mono text-ui text-faint">
                    {t('request_secret_page.kicker')}
                </div>
                <h1 className="m-0 text-[44px] leading-tight font-medium tracking-[-0.035em]">
                    {t('request_secret_page.error.title')}
                </h1>
                <p className="m-0 text-fg-3 text-lg text-pretty">{error}</p>
                <Link
                    to="/"
                    className={buttonClassName({
                        variant: 'secondary',
                        size: 'lg',
                        className: 'justify-self-start text-fg',
                    })}
                >
                    {t('request_secret_page.error.go_home_button')}
                </Link>
            </main>
        );
    }

    if (createdSecret) {
        return (
            <main className="max-w-content mx-auto px-6 py-12 grid gap-4">
                {kicker}
                <h1 className="m-0 text-[28px] font-medium tracking-tight">
                    {t('request_secret_page.success.title')}
                </h1>
                <div className="border border-line rounded-md bg-surface overflow-hidden">
                    <div className="p-4.5 grid gap-1.5">
                        <span className="text-ui text-muted">
                            {t('request_secret_page.success.decryption_key_label')}
                        </span>
                        <span className="font-mono text-base text-accent break-all">
                            {createdSecret.decryptionKey}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2.5 items-center p-3 border-t border-line-soft">
                        <Button variant="primary" onClick={() => copy(createdSecret.decryptionKey)}>
                            {copied ? t('common.copied') : t('common.copy')}
                        </Button>
                        <span className="text-ui text-muted">
                            {t('request_secret_page.success.manual_send_note')}
                        </span>
                    </div>
                </div>
                <p className="m-0 text-sm text-warn">{t('request_secret_page.success.warning')}</p>
                <Link to="/" className="justify-self-start text-sm text-accent hover:underline">
                    {t('request_secret_page.success.create_own_button')}
                </Link>
            </main>
        );
    }

    return (
        <main className="max-w-content mx-auto px-6 py-12 grid gap-4">
            {kicker}
            <h1 className="m-0 text-[28px] font-medium tracking-tight">
                {requestInfo?.title || t('request_secret_page.form.title')}
            </h1>
            <p className="m-0 max-w-155 text-fg-3">
                {requestInfo?.description || t('request_secret_page.form.description')}
            </p>

            <div className="border border-line rounded-md bg-surface overflow-hidden">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('composer.title_placeholder')}
                    aria-label={t('title_field.placeholder')}
                    className="w-full bg-transparent border-0 border-b border-line-soft px-4.5 py-3.5 text-sm text-fg placeholder:text-faint outline-none"
                />
                <Editor
                    value={secret}
                    onChange={setSecret}
                    placeholder={t('request_secret_page.form.placeholder')}
                    minHeightClassName="min-h-55"
                />
                <div className="flex flex-wrap items-center gap-2.5 py-2.5 pl-4.5 pr-3 border-t border-line-soft">
                    <span className="flex-1 font-mono text-xs text-muted">
                        {t('request_secret_page.form.settings_note')}
                    </span>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        loading={isSubmitting}
                        disabled={!secret.trim()}
                    >
                        {isSubmitting
                            ? t('request_secret_page.form.submitting_button')
                            : t('request_secret_page.form.submit_button')}
                    </Button>
                </div>
            </div>
            <p className="m-0 text-ui text-faint">
                {t('request_secret_page.form.encryption_note')}
            </p>
        </main>
    );
}
