import { useState } from 'react';
import { SecuritySettings } from './SecuritySettings';
import { FileUpload } from './FileUpload';
import { CreateButton } from './CreateButton';
import { TitleField } from './TitleField';
import Editor from './Editor';
import { api } from '../lib/api'; // Import the RPC client
import { encrypt, generateEncryptionKey } from '../lib/nacl';
import { useSecretStore } from '../store/secretStore';

export interface SecretFormData {
    secret: string;
    title: string;
    password?: string;
    expiresAt?: number;
    views: number;
    isBurnable: boolean;
    ipRange?: string | null;
}

export function SecretForm() {
    const { secret, title, password, expiresAt, views, isBurnable, ipRange, setSecretIdAndKeys, setSecretData } = useSecretStore();

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setIsLoading(true);

        const encryptionKey = generateEncryptionKey(password);

        // Transform empty strings to null for nullable fields
        const dataToSend = {
            secret: encrypt(secret, encryptionKey),
            title: encrypt(title, encryptionKey),
            password: password ? encryptionKey : '',
            expiresAt,
            views,
            isBurnable,
            ipRange: ipRange === '' ? null : ipRange,
        };

        try {
            const response = await api.secrets.$post({ json: dataToSend });
            const data = await response.json()

            if (data?.id) {
                setSecretIdAndKeys(data.id, encryptionKey, password);
            }
        } catch (error: any) {
            console.error('Failed to create secret:', error.message);
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
                    <FileUpload />
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
        </div>
    );
}
