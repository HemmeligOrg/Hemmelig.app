import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLoaderData, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, buttonClassName } from '../components/Button';
import Editor, { type EditorHandle } from '../components/Editor';
import { inputClassName } from '../components/Input';
import { useCopyFeedbackWithId } from '../hooks/useCopyFeedback';
import { api, apiRaw } from '../lib/api';
import {
    decrypt,
    decryptFile,
    derivePasswordVerifier,
    generateEncryptionKey,
    hexToBytes,
} from '../lib/crypto';

interface SecretFile {
    id: string;
    filename: string;
    token: string;
    displayName?: string;
}

interface SecretLoaderData {
    isPasswordProtected: boolean;
    /** Views left. Null means no view limit. */
    views: number | null;
    files: SecretFile[];
    passwordScheme?: 'derived' | 'legacy' | null;
    salt?: string | null;
}

type CopyFormat = 'text' | 'html' | 'base64';

/** The widths of the placeholder bars behind the unlock form. */
const REDACTED_WIDTHS = ['72%', '94%', '58%', '86%', '40%', '90%', '66%'];

/**
 * Resolves the file name for display. New files store an encrypted name.
 * Legacy files store the plaintext name with the id as a prefix.
 */
const resolveDisplayName = async (
    file: SecretFile,
    encryptionKey: string,
    secretSalt: string
): Promise<string> => {
    const encryptedBytes = hexToBytes(file.filename);

    if (encryptedBytes) {
        try {
            return await decrypt(encryptedBytes, encryptionKey, secretSalt);
        } catch {
            // Fall through to the legacy format.
        }
    }

    return file.filename.split('-').slice(1).join('-') || file.filename;
};

/** Encodes UTF-8 text as Base64 in a way that is safe for large strings. */
const toBase64 = (text: string) => {
    let binary = '';
    for (const byte of new TextEncoder().encode(text)) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
};

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
    const [decryptionKeyInput, setDecryptionKeyInput] = useState('');
    const [isPasswordProtected, setIsPasswordProtected] = useState(false);
    const [showSecretContent, setShowSecretContent] = useState(false);
    // Null means the secret has no view limit and lives until it expires.
    const [viewsRemaining, setViewsRemaining] = useState<number | null>(initialData?.views ?? null);
    const [salt, setSalt] = useState<string | null>(initialData?.salt ?? null);
    const { copy, isCopied } = useCopyFeedbackWithId<CopyFormat>();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteToken, setDeleteToken] = useState<string | null>(null);
    const [decryptionError, setDecryptionError] = useState<string | null>(null);
    const editorRef = useRef<EditorHandle | null>(null);

    // Short links (/s/:id#<key>) carry the key as the whole fragment. Older links
    // (/secret/:id#decryptionKey=<key>) name the key. Both forms work on both routes.
    const fragment = location.hash.slice(1);
    const decryptionKeyFromUrl = fragment.startsWith('decryptionKey=')
        ? fragment.slice('decryptionKey='.length)
        : fragment;

    // Use URL key if available, otherwise use manually entered key
    const decryptionKey = decryptionKeyFromUrl || decryptionKeyInput;

    // Check if we need manual key entry (no key in URL and not password protected)
    const needsManualKeyEntry = !decryptionKeyFromUrl && !isPasswordProtected;

    const fetchSecretContent = useCallback(
        async (password: string) => {
            setIsLoading(true);
            setDecryptionError(null);
            try {
                const finalDecryptionKey = password
                    ? generateEncryptionKey(password)
                    : decryptionKey;

                // Send only the access verifier for derived secrets. The password and
                // the decryption key never leave the browser.
                let json: { password?: string; passwordVerifier?: string } = {};
                if (isPasswordProtected) {
                    if (initialData?.passwordScheme === 'derived') {
                        if (!salt) {
                            throw new Error('Missing salt for password verification');
                        }
                        json = { passwordVerifier: await derivePasswordVerifier(password, salt) };
                    } else {
                        json = { password };
                    }
                }

                // The raw client returns error statuses instead of throwing, so the
                // unlock form can show the error in place.
                const response = await apiRaw.secrets[':id'].$post({
                    param: { id: id! },
                    json,
                });
                const data = await response.json();

                if (response.status === 200 && 'secret' in data) {
                    const decryptedSecret = await decrypt(
                        new Uint8Array(
                            Object.values(data.secret as unknown as Record<string, number>)
                        ),
                        finalDecryptionKey,
                        data.salt
                    );
                    // Check if title has actual encrypted data (not just an empty object from empty Uint8Array)
                    const titleHasData = data.title && Object.keys(data.title).length > 0;
                    const decryptedTitle = titleHasData
                        ? await decrypt(
                              new Uint8Array(
                                  Object.values(data.title as unknown as Record<string, number>)
                              ),
                              finalDecryptionKey,
                              data.salt
                          )
                        : null;
                    setSecretContent(decryptedSecret);
                    setTitle(decryptedTitle);
                    setFiles(
                        await Promise.all(
                            (data.files ?? []).map(async (file: SecretFile) => ({
                                ...file,
                                displayName: await resolveDisplayName(
                                    file,
                                    finalDecryptionKey,
                                    data.salt
                                ),
                            }))
                        )
                    );
                    setSalt(data.salt);
                    setShowSecretContent(true);

                    // The server issues this token only after a successful reveal.
                    if ('deleteToken' in data && typeof data.deleteToken === 'string') {
                        setDeleteToken(data.deleteToken);
                    }

                    // View consumption now happens atomically on the server during retrieval
                    // Update views from the response
                    if ('views' in data) {
                        setViewsRemaining(data.views);
                    }
                } else if (response.status === 401) {
                    setDecryptionError(t('secret_page.wrong_password'));
                } else {
                    setDecryptionError(t('secret_page.fetch_error'));
                }
            } catch (err: unknown) {
                console.error('Error fetching secret:', err);
                if (err instanceof Error && err.message.includes('decrypt')) {
                    setDecryptionError(t('secret_page.decryption_failed'));
                } else {
                    setDecryptionError(t('secret_page.fetch_error'));
                }
            } finally {
                setIsLoading(false);
            }
        },
        [decryptionKey, id, initialData?.passwordScheme, isPasswordProtected, salt, t]
    );

    useEffect(() => {
        if (initialData) {
            setIsPasswordProtected(initialData.isPasswordProtected);
            setViewsRemaining(initialData.views);
            setFiles(initialData.files);
        }
    }, [initialData]);

    const canUnlock = !(needsManualKeyEntry && !decryptionKeyInput);

    const handleViewSecret = () => {
        if (!canUnlock) return;
        fetchSecretContent(passwordInput);
    };

    const handleDownload = async (file: SecretFile) => {
        const finalDecryptionKey = passwordInput
            ? generateEncryptionKey(passwordInput)
            : decryptionKey;
        const response = await api.files[':id'].$get(
            { param: { id: file.id } },
            { headers: { 'x-hemmelig-file-token': file.token } }
        );
        const encryptedFile = await response.arrayBuffer();
        const decryptedFile = await decryptFile(
            new Uint8Array(encryptedFile),
            finalDecryptionKey,
            salt!
        );
        const blob = new Blob([decryptedFile]);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = file.displayName ?? file.filename;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const handleCopy = (format: CopyFormat) => {
        const editor = editorRef.current;
        const html = editor?.getHTML() ?? secretContent ?? '';
        const text = editor?.getText() ?? '';
        const value = format === 'html' ? html : format === 'base64' ? toBase64(text) : text;
        copy(value, format);
    };

    const handleDeleteSecret = async () => {
        if (!deleteToken) {
            setConfirmDelete(false);
            return;
        }

        setIsDeleting(true);
        try {
            const response = await api.secrets[':id'].$delete(
                { param: { id: id! } },
                { headers: { 'x-hemmelig-delete-token': deleteToken } }
            );
            if (response.ok) {
                navigate('/');
            }
        } catch (err) {
            console.error('Error deleting secret:', err);
        } finally {
            setIsDeleting(false);
            setConfirmDelete(false);
        }
    };

    const viewsBadge =
        viewsRemaining === null
            ? t('secret_page.after_burns_at_expiry')
            : t('secret_page.views_left', { count: Math.max(0, viewsRemaining) });

    // Loading state
    if (isLoading) {
        return (
            <main className="max-w-reading mx-auto px-6 py-24 flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
                <p className="m-0 font-mono text-ui text-muted">
                    {t('secret_page.loading_message')}
                </p>
            </main>
        );
    }

    // Pre-reveal state (unlock form over placeholder bars)
    if (!showSecretContent) {
        const gateNote =
            viewsRemaining === null
                ? t('secret_page.gate_burns_at_expiry')
                : viewsRemaining === 1
                  ? t('secret_page.one_view_remaining')
                  : t('secret_page.views_remaining', { count: viewsRemaining });

        return (
            <main className="max-w-reading mx-auto px-6 py-14 grid gap-4">
                <div className="border border-line rounded-md bg-surface overflow-hidden">
                    <div className="flex justify-between items-center gap-3 px-4.5 py-3.5 border-b border-line-soft">
                        <span className="font-mono text-ui">
                            {t('secret_page.encrypted_secret')}
                        </span>
                        {viewsBadge && (
                            <span className="font-mono text-xs text-muted border border-line px-2 py-0.5 rounded-[3px]">
                                {viewsBadge}
                            </span>
                        )}
                    </div>

                    <div className="grid">
                        <div
                            className="[grid-area:1/1] p-7 grid gap-3 content-start"
                            aria-hidden="true"
                        >
                            {REDACTED_WIDTHS.map((width, index) => (
                                <div
                                    key={index}
                                    className="h-3 rounded-xs bg-raised"
                                    style={{ width }}
                                />
                            ))}
                        </div>

                        <form
                            className="[grid-area:1/1] bg-surface/85 grid place-items-center px-6 py-9"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleViewSecret();
                            }}
                        >
                            <div className="w-full max-w-85 grid gap-3">
                                {needsManualKeyEntry && (
                                    <label className="grid gap-1.5">
                                        <span className="text-ui text-muted">
                                            {t('secret_page.decryption_key_label')}
                                        </span>
                                        <input
                                            type="text"
                                            value={decryptionKeyInput}
                                            onChange={(e) => {
                                                setDecryptionKeyInput(e.target.value);
                                                setDecryptionError(null);
                                            }}
                                            placeholder={t(
                                                'secret_page.decryption_key_placeholder'
                                            )}
                                            autoComplete="off"
                                            spellCheck={false}
                                            autoFocus
                                            className={inputClassName({
                                                mono: true,
                                                controlSize: 'lg',
                                                invalid: !!decryptionError,
                                                className: 'bg-canvas text-ui',
                                            })}
                                        />
                                    </label>
                                )}

                                {isPasswordProtected && (
                                    <label className="grid gap-1.5">
                                        <span className="text-ui text-muted">
                                            {t('secret_page.password_label')}
                                        </span>
                                        <input
                                            type="password"
                                            value={passwordInput}
                                            onChange={(e) => {
                                                setPasswordInput(e.target.value);
                                                setDecryptionError(null);
                                            }}
                                            placeholder={t('secret_page.password_placeholder')}
                                            autoFocus={!needsManualKeyEntry}
                                            className={inputClassName({
                                                controlSize: 'lg',
                                                invalid: !!decryptionError,
                                                className: 'bg-canvas',
                                            })}
                                        />
                                    </label>
                                )}

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    disabled={!canUnlock}
                                    className="w-full py-2.75"
                                >
                                    {t('secret_page.unlock_secret')}
                                </Button>

                                {decryptionError && (
                                    <p
                                        role="alert"
                                        className="m-0 font-mono text-ui text-danger text-center"
                                    >
                                        {decryptionError}
                                    </p>
                                )}

                                <p className="m-0 text-ui text-muted text-center text-pretty">
                                    {gateNote}
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        );
    }

    // Secret revealed state
    const afterNote =
        viewsRemaining === null
            ? t('secret_page.after_burns_at_expiry')
            : viewsRemaining === 0
              ? t('secret_page.after_last_view')
              : t('secret_page.after_views_left', { count: viewsRemaining });

    const copyButtons: { format: CopyFormat; label: string }[] = [
        { format: 'text', label: t('common.copy') },
        { format: 'html', label: t('secret_page.copy_html') },
        { format: 'base64', label: t('secret_page.copy_base64') },
    ];

    return (
        <main className="max-w-reading mx-auto px-6 py-14 grid gap-4">
            <div className="border border-line rounded-md bg-surface overflow-hidden">
                <div className="flex flex-wrap justify-between items-center gap-3 px-4.5 py-3.5 border-b border-line-soft">
                    <span className="font-medium min-w-0 break-words">
                        {title || t('secret_page.secret_revealed')}
                    </span>
                    <div className="flex gap-3 items-center font-mono text-xs">
                        {viewsBadge && <span className="text-muted">{viewsBadge}</span>}
                        {copyButtons.map(({ format, label }) => (
                            <button
                                key={format}
                                type="button"
                                onClick={() => handleCopy(format)}
                                className={`cursor-pointer hover:underline ${
                                    format === 'text' ? 'text-accent' : 'text-muted hover:text-fg'
                                }`}
                            >
                                {isCopied(format) ? t('common.copied') : label}
                            </button>
                        ))}
                    </div>
                </div>

                <Editor
                    value={secretContent || ''}
                    editable={false}
                    onEditorReady={(editor) => {
                        editorRef.current = editor;
                    }}
                />

                {files && files.length > 0 && (
                    <div className="border-t border-line-soft px-4.5 py-3 grid gap-2">
                        <span className="text-xs text-muted">
                            {t('secret_page.files_title')} ({files.length})
                        </span>
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className="flex justify-between items-center gap-3 px-2.5 py-2 border border-line-soft rounded-sm"
                            >
                                <span className="font-mono text-ui min-w-0 break-all">
                                    {file.displayName ?? file.filename}
                                </span>
                                <Button
                                    variant="link"
                                    size="inline"
                                    onClick={() => handleDownload(file)}
                                >
                                    {t('secret_page.download')}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-wrap gap-2.5 items-center p-3 border-t border-line-soft">
                    <Link to="/" className={buttonClassName({ variant: 'secondary' })}>
                        {t('secret_page.create_your_own')}
                    </Link>
                    <span className="flex-1 font-mono text-xs text-muted text-right">
                        {afterNote}
                    </span>
                    {deleteToken &&
                        (confirmDelete ? (
                            <>
                                <span className="text-ui text-fg-3">
                                    {t('secret_page.delete_confirm_question')}
                                </span>
                                <Button
                                    variant="danger-solid"
                                    onClick={handleDeleteSecret}
                                    loading={isDeleting}
                                    className="px-3"
                                >
                                    {t('common.delete')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="inline"
                                    onClick={() => setConfirmDelete(false)}
                                >
                                    {t('common.cancel')}
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="danger"
                                className="px-3"
                                onClick={() => setConfirmDelete(true)}
                            >
                                {t('secret_page.delete_secret')}
                            </Button>
                        ))}
                </div>
            </div>
        </main>
    );
}
