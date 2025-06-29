import { useState } from 'react';
import { SecuritySettings } from './SecuritySettings';
import { FileUpload } from './FileUpload';
import { CreateButton } from './CreateButton';
import { TitleField } from './TitleField';
import Editor from './Editor';
import { api } from '../lib/api'; // Import the RPC client

export interface SecretFormData {
    secret: string;
    title: string | null;
    password?: string | null;
    expiresAt?: number;
    views: number;
    isBurnable: boolean;
    ipRange?: string | null;
}

export function SecretForm() {
    const [formData, setFormData] = useState<SecretFormData>({
        secret: '',
        title: '',
        views: 1,
        isBurnable: false,
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setIsLoading(true);

        // Transform empty strings to null for nullable fields
        const dataToSend = {
            ...formData,
            title: formData.title === '' ? null : formData.title,
            password: formData.password === '' ? null : formData.password,
            ipRange: formData.ipRange === '' ? null : formData.ipRange,
        };

        try {
            console.log(dataToSend);
            const response = await api.secrets.$post({ json: dataToSend });

            console.log('Secret created successfully:', response);
            // Reset form
            setFormData({
                secret: '',
                title: '',
                views: 1,
                isBurnable: false,
                expiresAt: 14400, // 4 hours
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
