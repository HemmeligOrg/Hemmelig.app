import { useState } from 'react';
import { SecuritySettings } from './SecuritySettings';
import { FileUpload } from './FileUpload';
import { CreateButton } from './CreateButton';
import { TitleField } from './TitleField';
import Editor from './Editor';
import { Modal } from './Modal';
import { api } from '../lib/api'; // Import the RPC client
import { encrypt, generateEncryptionKey, encryptFile } from '../lib/nacl';
import { useSecretStore } from '../store/secretStore';
import { useTranslation } from 'react-i18next';

export interface SecretFormData {
    secret: string;
    title: string;
    password?: string;
    expiresAt?: number;
    views: number;
    isBurnable: boolean;
    ipRange?: string | null;
    files?: File[];
}

export function SecretForm() {
    const { secret, title, password, expiresAt, views, isBurnable, ipRange, setSecretIdAndKeys, setSecretData } = useSecretStore();
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

        const fileIds = [];
        if (files.length > 0) {
            for (const file of files) {
                try {
                    const encryptedFile = encryptFile(await file.arrayBuffer(), encryptionKey);
                    const encryptedFileAsFile = new File([encryptedFile], file.name, { type: file.type });

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
                    setErrorMessage(t('secret_form.failed_to_upload_file', { fileName: file.name }));
                    setIsErrorModalOpen(true);
                    setIsLoading(false);
                    console.error('File upload failed:', error);
                    return;
                }
            }
        }

        // Transform empty strings to null for nullable fields
        const dataToSend = {
            secret: encrypt(secret, encryptionKey),
            title: encrypt(title, encryptionKey),
            password: password ? encryptionKey : '',
            expiresAt,
            views,
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
                const errorMessage = data?.error?.issues?.[0]?.message || data?.error?.message || 'An unknown error occurred.';
                setErrorMessage(t('secret_form.failed_to_create_secret', { errorMessage: errorMessage }));
                setIsErrorModalOpen(true);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setErrorMessage(t('secret_form.failed_to_create_secret', { errorMessage: errorMessage }));
            setIsErrorModalOpen(true);
            console.error('Failed to create secret:', errorMessage);
            // Handle error, e.g., show a toast notification
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = secret.trim().length > 0;

    return (
        <div className="space-y-8">
            {/* Main editor card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
                <Editor
                    name="text"
                    content={secret}
                    onChange={(value) => setSecretData({ secret: value })}
                //editable={!inputReadOnly}
                />

                <div className="mt-6">
                    <TitleField
                        value={title}
                        onChange={(value) => setSecretData({ title: value })}
                    />
                </div>

                <div className="mt-6">
                    <FileUpload onFileChange={handleFileChange} />
                </div>
            </div>

            {/* Security settings */}
            <SecuritySettings />

            {/* Create button */}
            <CreateButton
                onSubmit={handleSubmit}
                isLoading={isLoading}
                disabled={!isFormValid}
            />
            <Modal
                isOpen={isErrorModalOpen}
                onClose={() => setIsErrorModalOpen(false)}
                title="Error"
                confirmText="OK"
                onConfirm={() => setIsErrorModalOpen(false)}
            >
                <p>{errorMessage}</p>
            </Modal>
        </div>
    );
}
