import { type KeyboardEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import {
    bytesToHex,
    derivePasswordVerifier,
    encrypt,
    encryptFile,
    generateEncryptionKey,
    generateSalt,
} from '../lib/crypto';
import { uploadEncryptedFile } from '../lib/upload';
import { useHemmeligStore } from '../store/hemmeligStore';
import { useSecretStore } from '../store/secretStore';
import { Button } from './Button';
import Editor from './Editor';
import { AttachmentRow, useAttachments } from './FileUpload';
import { Modal } from './Modal';
import { EXPIRATION_OPTIONS, MIN_PASSWORD_LENGTH, SecuritySettings } from './SecuritySettings';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);

export function SecretForm() {
    const {
        secret,
        title,
        password,
        expiresAt,
        views,
        isBurnable,
        ipRange,
        setSecretIdAndKeys,
        setSecretData,
    } = useSecretStore();
    const { settings } = useHemmeligStore();
    const { t } = useTranslation();

    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [showOptions, setShowOptions] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const attachments = useAttachments(setFiles);

    const passwordInvalid = password !== null && password.length < MIN_PASSWORD_LENGTH;
    const isFormValid = secret.trim().length > 0 && !passwordInvalid;

    const handleSubmit = async () => {
        if (!isFormValid || isLoading) return;
        setIsLoading(true);

        const secretPassword = password || null;
        const encryptionKey = generateEncryptionKey(secretPassword ?? undefined);
        const salt = generateSalt();

        const attachedFiles: { id: string; token: string }[] = [];
        if (files.length > 0) {
            for (const file of files) {
                try {
                    const encryptedFile = await encryptFile(
                        await file.arrayBuffer(),
                        encryptionKey,
                        salt
                    );
                    // A raw upload streams to disk on the server, so large files
                    // do not fill the server memory.
                    const uploaded = await uploadEncryptedFile(
                        encryptedFile,
                        bytesToHex(await encrypt(file.name, encryptionKey, salt))
                    );
                    attachedFiles.push(uploaded);
                } catch (error) {
                    setErrorMessage(
                        t('secret_form.failed_to_upload_file', { fileName: file.name })
                    );
                    setIsErrorModalOpen(true);
                    setIsLoading(false);
                    console.error('File upload failed:', error);
                    return;
                }
            }
        }

        const encryptedSecret = await encrypt(secret, encryptionKey, salt);
        const encryptedTitle = await encrypt(title, encryptionKey, salt);

        // Derive a verifier so the server can gate access without ever seeing
        // the password or the encryption key.
        const passwordVerifier = secretPassword
            ? await derivePasswordVerifier(secretPassword, salt)
            : undefined;

        // Transform empty strings to null for nullable fields
        const dataToSend = {
            secret: encryptedSecret,
            title: encryptedTitle,
            salt,
            passwordVerifier,
            expiresAt,
            // "Burn after time" removes the view limit, so the secret lives until it
            // expires. The API flag `isBurnable` means "burn after the last view" for
            // the CLIs, so the web form always sends false.
            views: isBurnable ? null : views,
            isBurnable: false,
            ipRange: ipRange === '' ? null : ipRange,
            files: attachedFiles,
        };

        try {
            const response = await api.secrets.$post({ json: dataToSend });
            const data = await response.json();

            if (response.ok && data?.id) {
                setSecretData({ fileCount: attachedFiles.length });
                setSecretIdAndKeys(data.id, encryptionKey, secretPassword);
            } else {
                const errorMessage =
                    data?.error?.issues?.[0]?.message ||
                    data?.error?.message ||
                    'An unknown error occurred.';
                setErrorMessage(
                    t('secret_form.failed_to_create_secret', { errorMessage: errorMessage })
                );
                setIsErrorModalOpen(true);
            }
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : 'An unknown error occurred.';
            setErrorMessage(
                t('secret_form.failed_to_create_secret', { errorMessage: errorMessage })
            );
            setIsErrorModalOpen(true);
            console.error('Failed to create secret:', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Capture Mod+Enter before the editor sees it, because the editor maps it to a line break.
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit();
        }
    };

    const expiration = EXPIRATION_OPTIONS.find((option) => option.value === expiresAt);
    const summary = [
        expiration
            ? t(`expiration.${expiration.key}`)
            : t('expiration.default_hours', { hours: Math.round(expiresAt / 3600) }),
        isBurnable
            ? t('composer.summary.burn_after_time')
            : t('composer.summary.views', { count: views }),
        password ? t('composer.summary.password') : null,
        ipRange ? t('composer.summary.ip', { range: ipRange }) : null,
        files.length ? t('composer.summary.files', { count: files.length }) : null,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <div className="grid gap-4" onKeyDownCapture={handleKeyDown}>
            <div
                {...attachments.getRootProps()}
                className={`border rounded-md bg-surface overflow-hidden transition-colors ${
                    attachments.isDragActive ? 'border-accent' : 'border-line'
                }`}
            >
                <input {...attachments.getInputProps()} />
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setSecretData({ title: e.target.value })}
                    placeholder={t('composer.title_placeholder')}
                    aria-label={t('title_field.placeholder')}
                    className="w-full bg-transparent border-0 border-b border-line-soft px-4.5 py-3.5 text-sm text-fg placeholder:text-faint outline-none"
                />
                <Editor
                    value={secret}
                    onChange={(value) => setSecretData({ secret: value })}
                    placeholder={t('composer.placeholder')}
                />
                {settings.allowFileUploads !== false && <AttachmentRow attachments={attachments} />}
                <div className="flex flex-wrap items-center gap-2.5 py-2.5 pl-4.5 pr-3 border-t border-line-soft">
                    <span className="flex-1 min-w-50 font-mono text-xs text-muted">{summary}</span>
                    <Button
                        variant="secondary"
                        onClick={() => setShowOptions(!showOptions)}
                        aria-expanded={showOptions}
                    >
                        {showOptions ? t('composer.options_hide') : t('composer.options_show')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        loading={isLoading}
                        disabled={!isFormValid}
                        title={t('composer.shortcut_hint', { shortcut: isMac ? '⌘↵' : 'Ctrl+↵' })}
                    >
                        {isLoading ? (
                            t('create_button.creating_secret')
                        ) : (
                            <>
                                {t('composer.create_link')}
                                <span className="opacity-70">{isMac ? '⌘↵' : 'Ctrl ↵'}</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {showOptions && <SecuritySettings />}

            <Modal
                isOpen={isErrorModalOpen}
                onClose={() => setIsErrorModalOpen(false)}
                title={t('common.error')}
                confirmText={t('common.ok')}
                confirmVariant="primary"
                onConfirm={() => setIsErrorModalOpen(false)}
            >
                <p>{errorMessage}</p>
            </Modal>
        </div>
    );
}
