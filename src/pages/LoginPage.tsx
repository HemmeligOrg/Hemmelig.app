import { Lock, User } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { LoadingButton } from '../components/LoadingButton';
import { PasswordToggle } from '../components/PasswordToggle';
import { SocialLoginButtons } from '../components/SocialLoginButtons';
import { useErrorModal } from '../hooks/useModalState';
import { authClient } from '../lib/auth';

export function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const errorModal = useErrorModal();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error, data } = await authClient.signIn.username(
                {
                    username: formData.username,
                    password: formData.password,
                },
                {
                    onSuccess(context) {
                        if (context.data.twoFactorRedirect) {
                            navigate('/verify-2fa');
                        } else {
                            navigate('/dashboard');
                        }
                    },
                }
            );

            if (error) {
                errorModal.showError(`Login failed: ${error.message}`);
            } else if (data && !('twoFactorRedirect' in data)) {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('An error occurred:', error);
            errorModal.showError(t('login_page.unexpected_error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthPageLayout
            title={t('login_page.sign_in_button')}
            subtitle={t('login_page.welcome_back')}
            backTo="/"
            backLabel={t('login_page.back_to_hemmelig')}
            errorModal={errorModal}
        >
            <Card noPadding className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <FormField
                        label={t('login_page.username_label')}
                        icon={User}
                        value={formData.username}
                        onChange={(value) => setFormData((prev) => ({ ...prev, username: value }))}
                        placeholder={t('login_page.username_placeholder')}
                        required
                    />

                    <FormField
                        label={t('login_page.password_label')}
                        icon={Lock}
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(value) => setFormData((prev) => ({ ...prev, password: value }))}
                        placeholder={t('login_page.password_placeholder')}
                        required
                        rightElement={
                            <PasswordToggle
                                visible={showPassword}
                                onToggle={() => setShowPassword(!showPassword)}
                            />
                        }
                    />

                    <LoadingButton
                        isLoading={isLoading}
                        loadingText={t('login_page.signing_in_button')}
                    >
                        <span>{t('login_page.sign_in_button')}</span>
                    </LoadingButton>
                </form>

                <SocialLoginButtons mode="login" />

                <div className="text-center mt-6 pt-5 border-t border-gray-200 dark:border-dark-600">
                    <p className="text-gray-500 dark:text-slate-400">
                        {t('login_page.no_account_question')}{' '}
                        <Link
                            to="/register"
                            className="text-teal-500 hover:text-teal-400 font-medium transition-colors duration-200"
                        >
                            {t('login_page.sign_up_link')}
                        </Link>
                    </p>
                </div>
            </Card>
        </AuthPageLayout>
    );
}
