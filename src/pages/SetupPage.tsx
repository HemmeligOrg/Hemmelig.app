import { Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { LoadingButton } from '../components/LoadingButton';
import Logo from '../components/Logo';
import { api } from '../lib/api';

export function SetupPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error(t('setup_page.passwords_mismatch'));
            return;
        }

        if (formData.password.length < 8) {
            toast.error(t('setup_page.password_too_short'));
            return;
        }

        setIsLoading(true);

        try {
            const res = await api.setup.complete.$post({
                json: {
                    name: formData.name,
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Setup failed');
            }

            toast.success(t('setup_page.success'));
            navigate('/login');
        } catch (error) {
            console.error('Setup failed:', error);
            toast.error(error instanceof Error ? error.message : t('setup_page.error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card noPadding className="p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center mb-4">
                            <Logo className="w-16 h-16 fill-gray-900 dark:fill-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {t('setup_page.title')}
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 mt-2">
                            {t('setup_page.description')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FormField
                            label={t('setup_page.name_label')}
                            icon={User}
                            value={formData.name}
                            onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
                            placeholder={t('setup_page.name_placeholder')}
                            required
                        />

                        <FormField
                            label={t('setup_page.username_label')}
                            icon={User}
                            value={formData.username}
                            onChange={(value) =>
                                setFormData((prev) => ({ ...prev, username: value }))
                            }
                            placeholder={t('setup_page.username_placeholder')}
                            required
                            minLength={3}
                            maxLength={32}
                        />

                        <FormField
                            label={t('setup_page.email_label')}
                            icon={Mail}
                            type="email"
                            value={formData.email}
                            onChange={(value) => setFormData((prev) => ({ ...prev, email: value }))}
                            placeholder={t('setup_page.email_placeholder')}
                            required
                        />

                        <FormField
                            label={t('setup_page.password_label')}
                            icon={Lock}
                            type="password"
                            value={formData.password}
                            onChange={(value) =>
                                setFormData((prev) => ({ ...prev, password: value }))
                            }
                            placeholder={t('setup_page.password_placeholder')}
                            required
                            minLength={8}
                        />

                        <FormField
                            label={t('setup_page.confirm_password_label')}
                            icon={Lock}
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(value) =>
                                setFormData((prev) => ({ ...prev, confirmPassword: value }))
                            }
                            placeholder={t('setup_page.confirm_password_placeholder')}
                            required
                            minLength={8}
                        />

                        <LoadingButton isLoading={isLoading} loadingText={t('setup_page.creating')}>
                            <span>{t('setup_page.create_admin')}</span>
                        </LoadingButton>
                    </form>

                    <p className="text-xs text-gray-500 dark:text-slate-400 text-center mt-6">
                        {t('setup_page.note')}
                    </p>
                </Card>
            </div>
        </div>
    );
}
