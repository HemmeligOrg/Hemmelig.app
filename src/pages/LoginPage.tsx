import { ArrowLeft, Eye, EyeOff, Lock, User } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
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
        <div className="min-h-screen bg-light-800 dark:bg-dark-900 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Back to Home */}
                <Link
                    to="/"
                    className="inline-flex items-center space-x-2 text-gray-500 dark:text-slate-400 hover:text-teal-400 transition-colors duration-300 mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                    <span>{t('login_page.back_to_hemmelig')}</span>
                </Link>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('login_page.sign_in_button')}
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">
                        {t('login_page.welcome_back')}
                    </p>
                </div>

                <Card gradient="teal" noPadding className="p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                                {t('login_page.username_label')}
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
                                    placeholder={t('login_page.username_placeholder')}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all duration-200"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                                {t('login_page.password_label')}
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
                                    placeholder={t('login_page.password_placeholder')}
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
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`
                                w-full flex items-center justify-center space-x-3 py-3 px-4 font-semibold transition-all duration-200
                                ${
                                    isLoading
                                        ? 'bg-gray-200 dark:bg-dark-600 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30'
                                }
                                focus:outline-none focus:ring-4 focus:ring-teal-500/30
                            `}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>{t('login_page.signing_in_button')}</span>
                                </>
                            ) : (
                                <span>{t('login_page.sign_in_button')}</span>
                            )}
                        </button>
                    </form>

                    {/* Social Login Buttons */}
                    <SocialLoginButtons mode="login" />

                    {/* Sign Up Link */}
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
            </div>
            <Modal
                isOpen={errorModal.isOpen}
                onClose={errorModal.close}
                title={t('common.error')}
                confirmText={t('common.ok')}
                onConfirm={errorModal.close}
                confirmButtonClass="bg-blue-600 hover:bg-blue-700"
            >
                <p>{errorModal.message}</p>
            </Modal>
        </div>
    );
}
