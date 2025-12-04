import { ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo.tsx';

import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient({ baseURL: window.location.origin });

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await authClient.requestPasswordReset({
                email,
                redirectTo: '/reset-password', // Assuming you'll have a reset-password page
            });

            if (error) {
                alert(`Password reset request failed: ${error.message}`);
            } else {
                console.log('Password reset request successful', data);
                setIsSubmitted(true);
            }
        } catch (error) {
            console.error('An error occurred:', error);
            alert(t('forgot_password_page.unexpected_error'));
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-light-800 dark:bg-dark-900 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Back to Login */}
                    <Link
                        to="/login"
                        className="inline-flex items-center space-x-2 text-gray-500 dark:text-slate-400 hover:text-teal-400 transition-colors duration-300 mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                        <span>{t('forgot_password_page.back_to_sign_in')}</span>
                    </Link>

                    {/* Success Message */}
                    <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6 shadow-xl text-center">
                        <div className="flex items-center justify-center mb-4">
                            <div className="relative">
                                <div className="relative bg-gradient-to-br from-green-400 to-green-600 p-2">
                                    <CheckCircle className="w-5 h-5 text-gray-900 dark:text-white" />
                                </div>
                            </div>
                        </div>

                        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                            {t('forgot_password_page.check_email_title')}
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">
                            {t('forgot_password_page.check_email_description', { email: email })}
                        </p>

                        <div className="space-y-3">
                            <p className="text-xs text-slate-500">
                                {t('forgot_password_page.did_not_receive_email')}
                            </p>

                            <button
                                onClick={() => setIsSubmitted(false)}
                                className="text-teal-400 hover:text-teal-300 font-medium transition-colors duration-300"
                            >
                                {t('forgot_password_page.try_again_button')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-light-800 dark:bg-dark-900 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Back to Login */}
                <Link
                    to="/login"
                    className="inline-flex items-center space-x-2 text-gray-500 dark:text-slate-400 hover:text-teal-400 transition-colors duration-300 mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                    <span>Back to Sign In</span>
                </Link>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-4">
                        <div className="relative">
                            <Logo className="w-10 h-10 fill-gray-900 dark:fill-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {t('forgot_password_page.forgot_password_title')}
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 text-sm">
                        {t('forgot_password_page.forgot_password_description')}
                    </p>
                </div>

                {/* Reset Form */}
                <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Field */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                                {t('forgot_password_page.email_label')}
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('forgot_password_page.email_placeholder')}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                {t('forgot_password_page.email_hint')}
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`
        w-full flex items-center justify-center space-x-3 py-2.5 px-4 font-semibold transition-all duration-300 transform
        ${
            isLoading
                ? 'bg-dark-600 text-gray-500 dark:text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-gray-900 dark:text-white hover:scale-105 hover:shadow-2xl shadow-teal-500/25'
        }
        focus:outline-none focus:ring-4 focus:ring-teal-500/50 focus:ring-offset-2 focus:ring-offset-white dark:ring-offset-dark-800
       `}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>{t('forgot_password_page.sending_button')}</span>
                                </>
                            ) : (
                                <span>{t('forgot_password_page.reset_password_button')}</span>
                            )}
                        </button>
                    </form>

                    {/* Additional Help */}
                    <div className="text-center mt-6 pt-4 border-t border-gray-200 dark:border-dark-600">
                        <p className="text-gray-500 dark:text-slate-400 text-sm">
                            {t('forgot_password_page.remember_password')}{' '}
                            <Link
                                to="/login"
                                className="text-teal-400 hover:text-teal-300 font-medium transition-colors duration-300"
                            >
                                {t('forgot_password_page.sign_in_link')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
