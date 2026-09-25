import { useCallback, useState } from 'react';
import { type FileRejection, useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useHemmeligStore } from '../store/hemmeligStore';
import { useUserStore } from '../store/userStore';

const DEFAULT_MAX_SIZE_KB = 1024;

export const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/**
 * Keeps the list of attached files and the dropzone state for the composer.
 * Spread `getRootProps()` on the drop area and render `getInputProps()` once.
 */
export function useAttachments(onFileChange: (files: File[]) => void) {
    const { t } = useTranslation();
    const { settings } = useHemmeligStore();
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);

    const maxSizeKb = settings.maxSecretSize ?? DEFAULT_MAX_SIZE_KB;
    const maxBytes = maxSizeKb * 1024;
    const maxSizeMb = (maxSizeKb / 1024).toFixed(1);

    const onDropRejected = useCallback(
        (rejections: FileRejection[]) => {
            const rejection = rejections[0];
            if (rejection?.errors.some((e) => e.code === 'file-too-large')) {
                setError(
                    t('file_upload.file_too_large', {
                        fileName: rejection.file.name,
                        fileSize: (rejection.file.size / 1024 / 1024).toFixed(2),
                        maxSize: maxSizeMb,
                    })
                );
            }
        },
        [maxSizeMb, t]
    );

    const onDrop = useCallback(
        (accepted: File[]) => {
            if (accepted.length === 0) return;
            setError(null);
            const currentSize = files.reduce((sum, file) => sum + file.size, 0);
            const addedSize = accepted.reduce((sum, file) => sum + file.size, 0);

            if (currentSize + addedSize > maxBytes) {
                setError(t('file_upload.max_size_exceeded', { maxSize: maxSizeMb }));
                return;
            }

            const next = [...files, ...accepted];
            setFiles(next);
            onFileChange(next);
        },
        [files, maxBytes, maxSizeMb, onFileChange, t]
    );

    const remove = (index: number) => {
        const next = files.filter((_, i) => i !== index);
        setFiles(next);
        setError(null);
        onFileChange(next);
    };

    const dropzone = useDropzone({
        onDrop,
        onDropRejected,
        maxSize: maxBytes,
        noClick: true,
        noKeyboard: true,
    });

    return { ...dropzone, files, error, remove, maxSizeMb };
}

type Attachments = ReturnType<typeof useAttachments>;

/** The attachment row of the composer: the attach button, the size limit and the file chips. */
export function AttachmentRow({ attachments }: { attachments: Attachments }) {
    const { t } = useTranslation();
    const { user } = useUserStore();
    const { files, error, remove, open, maxSizeMb, isDragActive } = attachments;

    return (
        <div className="flex flex-wrap gap-2 items-center px-4.5 py-2.5 border-t border-line-soft">
            {user ? (
                <>
                    <button
                        type="button"
                        onClick={open}
                        className="text-ui text-muted hover:text-fg cursor-pointer"
                    >
                        {isDragActive ? t('file_upload.drop_files_here') : t('file_upload.attach')}
                    </button>
                    <span className="font-mono text-2xs text-faint">
                        {t('file_upload.max_size', { size: maxSizeMb })}
                    </span>
                </>
            ) : (
                <Link to="/login" className="text-ui text-muted hover:text-fg">
                    {t('file_upload.sign_in_to_upload')}
                </Link>
            )}
            {files.map((file, index) => (
                <span
                    key={`${file.name}-${index}`}
                    className="flex gap-2 items-center py-0.5 pl-2.5 pr-1 border border-line rounded-sm font-mono text-xs"
                >
                    <span className="truncate max-w-48">{file.name}</span>
                    <span className="text-faint">{formatBytes(file.size)}</span>
                    <button
                        type="button"
                        onClick={() => remove(index)}
                        aria-label={t('file_upload.remove', { fileName: file.name })}
                        className="px-1.5 text-muted hover:text-fg cursor-pointer"
                    >
                        ×
                    </button>
                </span>
            ))}
            {error && <span className="basis-full text-xs text-danger">{error}</span>}
        </div>
    );
}
