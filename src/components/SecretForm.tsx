import React, { useState } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { SecuritySettings } from './SecuritySettings';
import { FileUpload } from './FileUpload';
import { CreateButton } from './CreateButton';
import { TitleField } from './TitleField';
import Editor from './Editor';

export interface SecretFormData {
    secret: string;
    title: string;
    password?: string;
    expiresAt?: Date;
    views: number;
    isBurnable: boolean;
    isPublic: boolean;
    ipRange?: string;
}

export function SecretForm() {
    const [formData, setFormData] = useState<SecretFormData>({
        secret: '',
        title: '',
        views: 1,
        isBurnable: false,
        isPublic: false,
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Creating secret with data:', formData);

        setIsLoading(false);

        // Reset form
        setFormData({
            secret: '',
            title: '',
            views: 1,
            isBurnable: false,
            isPublic: false,
        });
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
                    setContent={(value) => updateFormData({ secret: value })}
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
