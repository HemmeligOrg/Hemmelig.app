import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
        <div className="min-h-screen bg-canvas text-fg">
            <main className="max-w-[380px] mx-auto px-6 py-20 grid gap-4">
                <div className="flex items-center gap-2.5 font-mono font-medium text-body">
                    <Logo className="w-5 h-5 fill-current" aria-hidden="true" />
                    hemmelig
                </div>

                <div className="grid gap-1">
                    <h1 className="m-0 text-2xl font-medium tracking-tight">
                        {t('setup_page.title')}
                    </h1>
                    <p className="m-0 text-sm text-fg-3">{t('setup_page.description')}</p>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4">
                    <FormField
                        label={t('setup_page.name_label')}
                        value={formData.name}
                        onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
                        autoComplete="name"
                        required
                    />

                    <FormField
                        label={t('setup_page.username_label')}
                        value={formData.username}
                        onChange={(value) => setFormData((prev) => ({ ...prev, username: value }))}
                        autoComplete="username"
                        required
                        minLength={3}
                        maxLength={32}
                    />

                    <FormField
                        label={t('setup_page.email_label')}
                        type="email"
                        value={formData.email}
                        onChange={(value) => setFormData((prev) => ({ ...prev, email: value }))}
                        autoComplete="email"
                        required
                    />

                    <FormField
                        label={t('setup_page.password_label')}
                        type="password"
                        value={formData.password}
                        onChange={(value) => setFormData((prev) => ({ ...prev, password: value }))}
                        placeholder={t('setup_page.password_placeholder')}
                        autoComplete="new-password"
                        required
                        minLength={8}
                    />

                    <FormField
                        label={t('setup_page.confirm_password_label')}
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(value) =>
                            setFormData((prev) => ({ ...prev, confirmPassword: value }))
                        }
                        autoComplete="new-password"
                        required
                        minLength={8}
                    />

                    <LoadingButton isLoading={isLoading} loadingText={t('setup_page.creating')}>
                        {t('setup_page.create_admin')}
                    </LoadingButton>
                </form>

                <p className="m-0 text-ui text-muted">{t('setup_page.note')}</p>
            </main>
        </div>
    );
}
