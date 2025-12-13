import { ArrowLeft, Check, Eye, EyeOff, Lock, Mail, Ticket, User } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { SocialLoginButtons } from '../components/SocialLoginButtons';
import { apiRaw } from '../lib/api';
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
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [inviteCodeError, setInviteCodeError] = useState('');

    const showError = (message: string) => {
        setErrorMessage(message);
        setIsErrorModalOpen(true);
    };

    const validateInviteCode = async (): Promise<boolean> => {
        if (!settings.requireInviteCode) return true;

        if (!formData.inviteCode) {
            setInviteCodeError(t('register_page.invite_code_required'));
            return false;
        }

        try {
            const res = await apiRaw.invites.public.validate.$post({
                json: { code: formData.inviteCode },
            });
            const result = await res.json();
            if (!result.valid) {
                setInviteCodeError(
                    'error' in result ? result.error : t('register_page.invalid_invite_code')
                );
                return false;
            }
            return true;
        } catch {
            setInviteCodeError(t('register_page.failed_to_validate_invite'));
            return false;
        }
    };

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

    const markInviteCodeUsed = async (userId: string) => {
        if (!formData.inviteCode) return;

        try {
            await apiRaw.invites.public.use.$post({
                json: { code: formData.inviteCode, userId },
            });
        } catch (e) {
            console.error('Failed to mark invite code as used:', e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            showError(t('register_page.password_mismatch_alert'));
            return;
        }

        if (!(await validateInviteCode())) return;

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
                showError(userMessage);
                return;
            }

            if (data?.user?.id) {
                await markInviteCodeUsed(data.user.id);
                navigate('/dashboard');
            }
        } catch {
            showError(t('register_page.unexpected_error'));
        } finally {
            setIsLoading(false);
        }
    };

    const passwordStrength = getPasswordStrength(formData.password);
    const strengthColors = [
        'bg-red-500',
        'bg-orange-500',
        'bg-yellow-500',
        'bg-blue-500',
        'bg-green-500',
    ];
    const strengthLabels = [
        t('register_page.password_strength_levels.very_weak'),
        t('register_page.password_strength_levels.weak'),
        t('register_page.password_strength_levels.fair'),
        t('register_page.password_strength_levels.good'),
        t('register_page.password_strength_levels.strong'),
    ];

    return (
        <div className="min-h-screen bg-light-800 dark:bg-dark-900 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Back to Home */}
                <Link
                    to="/"
                    className="inline-flex items-center space-x-2 text-gray-500 dark:text-slate-400 hover:text-teal-400 transition-colors duration-300 mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                    <span>{t('register_page.back_to_hemmelig')}</span>
                </Link>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('register_page.create_account_button')}
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">
                        {t('register_page.join_hemmelig')}
                    </p>
                </div>

                {/* Register Form */}
                <div className="relative bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-6 sm:p-8 shadow-lg shadow-gray-200/50 dark:shadow-dark-900/50">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Invite Code Field (conditional) */}
                        {settings.requireInviteCode && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                                    {t('register_page.invite_code_label')}
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500">
                                        <Ticket className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.inviteCode}
                                        onChange={(e) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                inviteCode: e.target.value.toUpperCase(),
                                            }));
                                            setInviteCodeError('');
                                        }}
                                        placeholder={t('register_page.invite_code_placeholder')}
                                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-700/50 border ${inviteCodeError ? 'border-red-500' : 'border-gray-200 dark:border-dark-500/50'} text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all duration-200`}
                                        required
                                    />
                                </div>
                                {inviteCodeError && (
                                    <p className="text-xs text-red-500">{inviteCodeError}</p>
                                )}
                            </div>
                        )}

                        {/* Username Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                                {t('register_page.username_label')}
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500">
                                    <User className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            username: e.target.value,
                                        }))
                                    }
                                    placeholder={t('register_page.username_placeholder')}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all duration-200"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                                {t('register_page.email_label')}
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                                    }
                                    placeholder={t('register_page.email_placeholder')}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all duration-200"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                                {t('register_page.password_label')}
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            password: e.target.value,
                                        }))
                                    }
                                    placeholder={t('register_page.password_placeholder')}
                                    className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all duration-200"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors duration-200"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="space-y-2">
                                    <div className="flex space-x-1">
                                        {[...Array(5)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 transition-all duration-200 ${
                                                    i < passwordStrength
                                                        ? strengthColors[passwordStrength - 1]
                                                        : 'bg-gray-200 dark:bg-dark-600'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p
                                        className={`text-xs ${passwordStrength >= 3 ? 'text-green-500' : passwordStrength >= 2 ? 'text-yellow-500' : 'text-red-500'}`}
                                    >
                                        {t('register_page.password_strength_label')}:{' '}
                                        {t(
                                            `register_page.password_strength_levels.${strengthLabels[passwordStrength - 1].toLowerCase().replace(' ', '_')}`
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                                {t('register_page.confirm_password_label')}
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            confirmPassword: e.target.value,
                                        }))
                                    }
                                    placeholder={t('register_page.confirm_password_placeholder')}
                                    className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all duration-200"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors duration-200"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {/* Password Match Indicator */}
                            {formData.confirmPassword && (
                                <div className="flex items-center space-x-2">
                                    {formData.password === formData.confirmPassword ? (
                                        <>
                                            <Check className="w-4 h-4 text-green-500" />
                                            <span className="text-xs text-green-500">
                                                {t('register_page.passwords_match')}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-xs text-red-500">
                                            {t('register_page.passwords_do_not_match')}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || formData.password !== formData.confirmPassword}
                            className={`
                                w-full flex items-center justify-center space-x-3 py-3 px-4 font-semibold transition-all duration-200
                                ${
                                    isLoading || formData.password !== formData.confirmPassword
                                        ? 'bg-gray-200 dark:bg-dark-600 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30'
                                }
                                focus:outline-none focus:ring-4 focus:ring-teal-500/30
                            `}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>{t('register_page.creating_account_button')}</span>
                                </>
                            ) : (
                                <span>{t('register_page.create_account_button')}</span>
                            )}
                        </button>
                    </form>

                    {/* Social Login Buttons */}
                    <SocialLoginButtons mode="register" />

                    {/* Sign In Link */}
                    <div className="text-center mt-6 pt-5 border-t border-gray-200 dark:border-dark-600">
                        <p className="text-gray-500 dark:text-slate-400">
                            {t('register_page.already_have_account_question')}{' '}
                            <Link
                                to="/login"
                                className="text-teal-500 hover:text-teal-400 font-medium transition-colors duration-200"
                            >
                                {t('register_page.sign_in_link')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
            <Modal
                isOpen={isErrorModalOpen}
                onClose={() => setIsErrorModalOpen(false)}
                title={t('common.error')}
                confirmText={t('common.ok')}
                onConfirm={() => setIsErrorModalOpen(false)}
                confirmButtonClass="bg-blue-600 hover:bg-blue-700"
            >
                <p>{errorMessage}</p>
            </Modal>
        </div>
    );
}
