import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { FormField } from '../components/FormField';
import { LoadingButton } from '../components/LoadingButton';
import { Notice } from '../components/Notice';
import { PasswordToggle } from '../components/PasswordToggle';
import { SocialLoginButtons } from '../components/SocialLoginButtons';
import { useErrorModal } from '../hooks/useModalState';
import { authClient } from '../lib/auth';
import { useHemmeligStore } from '../store/hemmeligStore';
import { getPasswordStrength } from '../utils/password';

export function RegisterPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { settings } = useHemmeligStore();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        inviteCode: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [inviteCodeError, setInviteCodeError] = useState('');
    const errorModal = useErrorModal();

    const isEmailPasswordDisabled = settings.disableEmailPasswordSignup;

    const parseRegistrationError = (error: unknown): string => {
        const errorObj = error as {
            code?: string;
            message?: string;
            statusText?: string;
            error?: { code?: string; message?: string; cause?: { message?: string } };
            cause?: { message?: string };
        };

        const errorCode = errorObj.code || errorObj.error?.code || '';
        const errorMsg = errorObj.message || errorObj.error?.message || '';
        const causeMsg = errorObj.cause?.message || errorObj.error?.cause?.message || '';
        const statusText = errorObj.statusText || '';
        const allErrorText = `${errorCode} ${errorMsg} ${causeMsg} ${statusText}`.toLowerCase();

        if (
            allErrorText.includes('email_domain_not_allowed') ||
            allErrorText.includes('email domain') ||
            allErrorText.includes('domain not allowed') ||
            allErrorText.includes('restricted to') ||
            allErrorText.includes('forbidden')
        ) {
            return t('register_page.email_domain_not_allowed');
        }

        if (allErrorText.includes('already exists') || errorCode === 'USER_ALREADY_EXISTS') {
            return t('register_page.account_already_exists');
        }

        if (causeMsg) return causeMsg;
        if (errorMsg && errorMsg !== 'Internal Server Error') return errorMsg;
        if (statusText && statusText !== 'Internal Server Error') return statusText;

        return t('register_page.unexpected_error');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            errorModal.showError(t('register_page.password_mismatch_alert'));
            return;
        }

        // The server enforces and consumes the invite code during sign-up.
        if (settings.requireInviteCode && !formData.inviteCode) {
            setInviteCodeError(t('register_page.invite_code_required'));
            return;
        }

        setIsLoading(true);
        setInviteCodeError('');

        try {
            let registrationError: string | null = null;

            const { data, error } = await authClient.signUp.email(
                {
                    email: formData.email,
                    password: formData.password,
                    username: formData.username,
                    name: formData.username,
                    ...(formData.inviteCode ? { inviteCode: formData.inviteCode } : {}),
                },
                {
                    onError: (ctx) => {
                        const errorDetails = ctx.error as {
                            error?: { message?: string };
                            message?: string;
                            body?: { message?: string };
                        };
                        registrationError =
                            errorDetails?.error?.message ||
                            errorDetails?.message ||
                            errorDetails?.body?.message ||
                            null;
                    },
                }
            );

            if (error || registrationError) {
                const userMessage = registrationError || parseRegistrationError(error);
                errorModal.showError(userMessage);
                return;
            }

            if (data?.user?.id) {
                navigate('/dashboard');
            }
        } catch {
            errorModal.showError(t('register_page.unexpected_error'));
        } finally {
            setIsLoading(false);
        }
    };

    const passwordStrength = getPasswordStrength(formData.password);
    // Weak passwords show the danger color, fair ones warn, good ones the accent.
    const strengthColor =
        passwordStrength >= 4 ? 'bg-accent' : passwordStrength >= 3 ? 'bg-warn' : 'bg-danger';
    const strengthText =
        passwordStrength >= 4 ? 'text-accent' : passwordStrength >= 3 ? 'text-warn' : 'text-danger';
    const strengthLabels = [
        t('register_page.password_strength_levels.very_weak'),
        t('register_page.password_strength_levels.weak'),
        t('register_page.password_strength_levels.fair'),
        t('register_page.password_strength_levels.good'),
        t('register_page.password_strength_levels.strong'),
    ];

    return (
        <AuthPageLayout
            title={t('register_page.create_account_title')}
            subtitle={t('register_page.join_hemmelig')}
            errorModal={errorModal}
        >
            {isEmailPasswordDisabled && (
                <Notice>{t('register_page.email_password_disabled_message')}</Notice>
            )}

            {!isEmailPasswordDisabled && (
                <form onSubmit={handleSubmit} className="grid gap-4">
                    {settings.requireInviteCode && (
                        <FormField
                            label={t('register_page.invite_code_label')}
                            value={formData.inviteCode}
                            onChange={(value) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    inviteCode: value.toUpperCase(),
                                }));
                                setInviteCodeError('');
                            }}
                            placeholder={t('register_page.invite_code_placeholder')}
                            className="font-mono"
                            required
                            error={inviteCodeError}
                        />
                    )}

                    <FormField
                        label={t('register_page.username_label')}
                        value={formData.username}
                        onChange={(value) => setFormData((prev) => ({ ...prev, username: value }))}
                        autoComplete="username"
                        required
                    />

                    <FormField
                        label={t('register_page.email_label')}
                        type="email"
                        value={formData.email}
                        onChange={(value) => setFormData((prev) => ({ ...prev, email: value }))}
                        autoComplete="email"
                        required
                    />

                    <div className="grid gap-2">
                        <FormField
                            label={t('register_page.password_label')}
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(value) =>
                                setFormData((prev) => ({ ...prev, password: value }))
                            }
                            autoComplete="new-password"
                            required
                            rightElement={
                                <PasswordToggle
                                    visible={showPassword}
                                    onToggle={() => setShowPassword(!showPassword)}
                                    label={t('login_page.show_password')}
                                />
                            }
                        />

                        {formData.password && (
                            <div className="grid gap-1.5">
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-colors ${
                                                i < passwordStrength ? strengthColor : 'bg-line'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <p className={`m-0 text-xs ${strengthText}`}>
                                    {t('register_page.password_strength_label')}:{' '}
                                    {strengthLabels[passwordStrength - 1]}
                                </p>
                            </div>
                        )}
                    </div>

                    <FormField
                        label={t('register_page.confirm_password_label')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(value) =>
                            setFormData((prev) => ({
                                ...prev,
                                confirmPassword: value,
                            }))
                        }
                        autoComplete="new-password"
                        required
                        error={
                            formData.confirmPassword &&
                            formData.password !== formData.confirmPassword
                                ? t('register_page.passwords_do_not_match')
                                : undefined
                        }
                        hint={
                            formData.confirmPassword &&
                            formData.password === formData.confirmPassword
                                ? t('register_page.passwords_match')
                                : undefined
                        }
                        rightElement={
                            <PasswordToggle
                                visible={showConfirmPassword}
                                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                                label={t('login_page.show_password')}
                            />
                        }
                    />

                    <LoadingButton
                        isLoading={isLoading}
                        disabled={formData.password !== formData.confirmPassword}
                        loadingText={t('register_page.creating_account_button')}
                    >
                        {t('register_page.create_account_button')}
                    </LoadingButton>
                </form>
            )}

            <SocialLoginButtons mode="register" />

            <div className="text-sm text-muted">
                {t('register_page.already_have_account_question')}{' '}
                <Link to="/login" className="text-accent hover:underline">
                    {t('register_page.sign_in_link')}
                </Link>
            </div>
        </AuthPageLayout>
    );
}
