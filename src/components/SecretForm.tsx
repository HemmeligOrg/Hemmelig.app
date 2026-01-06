import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { encrypt, encryptFile, generateEncryptionKey, generateSalt } from '../lib/crypto';
import { useHemmeligStore } from '../store/hemmeligStore';
import { useSecretStore } from '../store/secretStore';
import { Card } from './Card';
import { CreateButton } from './CreateButton';
import Editor from './Editor';
import { FileUpload } from './FileUpload';
import { Modal } from './Modal';
import { SecuritySettings } from './SecuritySettings';
import { TitleField } from './TitleField';

export function SecretForm() {
    const { settings: instanceSettings } = useHemmeligStore();
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
    const { t } = useTranslation();

    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleFileChange = (files: File[]) => {
        setFiles(files);
    };

    const handleSubmit = async () => {
        setIsLoading(true);

        const encryptionKey = generateEncryptionKey(password);
        const salt = generateSalt();

        const fileIds = [];
        if (files.length > 0) {
            for (const file of files) {
                try {
                    const encryptedFile = await encryptFile(
                        await file.arrayBuffer(),
                        encryptionKey,
                        salt
                    );
                    const encryptedFileAsFile = new File([encryptedFile], file.name, {
                        type: file.type,
                    });

                    const response = await api.files.$post({
                        form: {
                            file: encryptedFileAsFile,
                        },
                    });
                    const data = await response.json();
                    if (response.ok) {
                        fileIds.push(data.id);
                    } else {
                        throw new Error(data.error || 'File upload failed');
                    }
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

        // Transform empty strings to null for nullable fields
        const dataToSend = {
            secret: encryptedSecret,
            title: encryptedTitle,
            salt,
            password: password ? encryptionKey : '',
            expiresAt,
            // When isBurnable is true, views should be null (unlimited) so the secret only burns after time expires
            views: isBurnable ? null : views,
            isBurnable,
            ipRange: ipRange === '' ? null : ipRange,
            fileIds,
        };

        try {
            const response = await api.secrets.$post({ json: dataToSend });
            const data = await response.json();

            if (response.ok && data?.id) {
                setSecretIdAndKeys(data.id, encryptionKey, password);
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
            // Handle error, e.g., show a toast notification
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = secret.trim().length > 0;

    return (
        <div className="space-y-6">
            <Card gradient="teal" hover>
                <Editor value={secret} onChange={(value) => setSecretData({ secret: value })} />

                <div className="mt-5">
                    <TitleField
                        value={title}
                        onChange={(value) => setSecretData({ title: value })}
                    />
                </div>

                {/* File upload and quick create button */}
                <div className="mt-5 flex flex-col sm:flex-row gap-4 sm:items-start">
                    <div className="flex-1">
                        <FileUpload onFileChange={handleFileChange} compact />
                    </div>
                    <div className="sm:flex-shrink-0">
                        <CreateButton
                            onSubmit={handleSubmit}
                            isLoading={isLoading}
                            disabled={!isFormValid}
                        />
                    </div>
                </div>
            </Card>

            <SecuritySettings instanceSettings={instanceSettings} />

            {/* Create button */}
            <CreateButton onSubmit={handleSubmit} isLoading={isLoading} disabled={!isFormValid} />
            <Modal
                isOpen={isErrorModalOpen}
                onClose={() => setIsErrorModalOpen(false)}
                title={t('common.error')}
                confirmText={t('common.ok')}
                onConfirm={() => setIsErrorModalOpen(false)}
            >
                <p>{errorMessage}</p>
            </Modal>
        </div>
    );
}
