import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { FormField } from '../components/FormField';
import { LoadingButton } from '../components/LoadingButton';
import { PasswordToggle } from '../components/PasswordToggle';
import { SocialLoginButtons } from '../components/SocialLoginButtons';
import { useErrorModal } from '../hooks/useModalState';
import { authClient } from '../lib/auth';
import { useHemmeligStore } from '../store/hemmeligStore';

interface LoginLocationState {
    requireAccount?: boolean;
}

export function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { settings } = useHemmeligStore();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const errorModal = useErrorModal();

    // HomePage sends this state when the instance requires an account to create secrets.
    const requireAccount = !!(location.state as LoginLocationState | null)?.requireAccount;
    // After sign-in, go back to the home page when the user came from there.
    const nextPath = requireAccount ? '/' : '/dashboard';

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
                            navigate('/verify-2fa', { state: location.state });
                        } else {
                            navigate(nextPath);
                        }
                    },
                }
            );

            if (error) {
                errorModal.showError(t('login_page.login_failed', { message: error.message }));
            } else if (data && !('twoFactorRedirect' in data)) {
                navigate(nextPath);
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
            title={t('login_page.sign_in_to', { name: settings.instanceName || 'hemmelig' })}
            errorModal={errorModal}
        >
            {requireAccount && (
                <div className="text-sm text-warn">{t('login_page.require_account_notice')}</div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4">
                <FormField
                    label={t('login_page.username_label')}
                    value={formData.username}
                    onChange={(value) => setFormData((prev) => ({ ...prev, username: value }))}
                    autoComplete="username"
                    required
                />

                <FormField
                    label={t('login_page.password_label')}
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(value) => setFormData((prev) => ({ ...prev, password: value }))}
                    autoComplete="current-password"
                    required
                    rightElement={
                        <PasswordToggle
                            visible={showPassword}
                            onToggle={() => setShowPassword(!showPassword)}
                            label={t('login_page.show_password')}
                        />
                    }
                />

                <LoadingButton
                    isLoading={isLoading}
                    loadingText={t('login_page.signing_in_button')}
                >
                    {t('login_page.sign_in_button')}
                </LoadingButton>
            </form>

            <SocialLoginButtons mode="login" />

            {settings.allowRegistration && (
                <div className="text-sm text-muted">
                    {t('login_page.no_account_question')}{' '}
                    <Link to="/register" className="text-accent hover:underline">
                        {t('login_page.sign_up_link')}
                    </Link>
                </div>
            )}
        </AuthPageLayout>
    );
}
