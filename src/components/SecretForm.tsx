import { useState } from 'react';
import { SecuritySettings } from './SecuritySettings';
import { FileUpload } from './FileUpload';
import { CreateButton } from './CreateButton';
import { TitleField } from './TitleField';
import Editor from './Editor';
import { api } from '../lib/api'; // Import the RPC client
import { encrypt, generateEncryptionKey } from '../lib/nacl';

export interface SecretFormData {
    secret: string;
    title: string;
    password?: string;
    expiresAt?: number;
    views: number;
    isBurnable: boolean;
    ipRange?: string | null;
}

interface SecretFormProps {
    onSecretCreated: (id: string, key: string, password?: string) => void;
}

export function SecretForm({ onSecretCreated }: SecretFormProps) {
    const [formData, setFormData] = useState<SecretFormData>({
        secret: '',
        title: '',
        views: 1,
        isBurnable: false,
        expiresAt: 14400, // 4 hours
        password: '',
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setIsLoading(true);

        const encryptionKey = generateEncryptionKey(formData.password);

        // Transform empty strings to null for nullable fields
        const dataToSend = {
            ...formData,
            secret: encrypt(formData.secret, encryptionKey),
            title: encrypt(formData.title, encryptionKey),
            password: formData.password === '' ? '' : encryptionKey,
            ipRange: formData.ipRange === '' ? null : formData.ipRange,
        };

        try {
            const response = await api.secrets.$post({ json: dataToSend });
            const data = await response.json()

            if (data?.id) {
                onSecretCreated(data.id, formData.password === '' ? encryptionKey : '', formData.password);
            }

            // Reset form
            setFormData({
                secret: '',
                title: '',
                views: 1,
                isBurnable: false,
                expiresAt: 14400, // 4 hours
                password: '',
            });
        } catch (error: any) {
            console.error('Failed to create secret:', error.message);
            // Handle error, e.g., show a toast notification
        } finally {
            setIsLoading(false);
        }
    };

    const updateFormData = (updates: Partial<SecretFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const isFormValid = formData.secret.trim().length > 0;

    return (
        <div className="space-y-8">
            {/* Main editor card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
                <Editor
                    name="text"
                    content={formData.secret}
                    onChange={(value) => updateFormData({ secret: value })}
                //editable={!inputReadOnly}
                />

                <div className="mt-6">
                    <TitleField
                        value={formData.title}
                        onChange={(title) => updateFormData({ title })}
                    />
                </div>

                <div className="mt-6">
                    <FileUpload />
                </div>
            </div>

            {/* Security settings */}
            <SecuritySettings
                formData={formData}
                onChange={updateFormData}
            />

            {/* Create button */}
            <CreateButton
                onSubmit={handleSubmit}
                isLoading={isLoading}
                disabled={!isFormValid}
            />
        </div>
    );
}
