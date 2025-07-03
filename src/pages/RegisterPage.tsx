import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Github, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import Logo from '../components/Logo';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';

import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({ baseURL: "http://localhost:5173" });

export function RegisterPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setErrorMessage(t('register_page.password_mismatch_alert'));
            setIsErrorModalOpen(true);
            return;
        }

        setIsLoading(true);

        try {
            const { data, error } = await authClient.signUp.email({
                email: formData.email,
                password: formData.password,
                username: formData.username,
                name: formData.username
            });

            if (error) {
                setErrorMessage(`Registration failed: ${error.message}`);
                setIsErrorModalOpen(true);
            } else {
                console.log('Registration successful', data);
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('An error occurred:', error);
            setErrorMessage('An unexpected error occurred. Please try again.');
            setIsErrorModalOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGithubLogin = () => {
        console.log('GitHub OAuth registration');
        // Implement GitHub OAuth
    };

    // TODO: Consider to remove this
    const getPasswordStrength = (password: string) => {
        const length = password.length;
        if (length === 0) return 0;

        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);

        const typesCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

        if (length < 8) return 1; // All short passwords are weak

        if (typesCount <= 1) return 1; // Passwords with only one type of character are weak

        let strength = 1;
        if (typesCount >= 2) {
            strength = 2;
        }
        if (typesCount >= 3) {
            strength = 3;
        }
        if (length >= 12 && typesCount >= 3) {
            strength = 4;
        }
        if (length >= 12 && typesCount === 4) {
            strength = 5;
        }

        return strength;
    };

    const passwordStrength = getPasswordStrength(formData.password);
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Back to Home */}
                <Link
                    to="/"
                    className="inline-flex items-center space-x-2 text-slate-400 hover:text-teal-400 transition-colors duration-300 mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                    <span>{t('register_page.back_to_hemmelig')}</span>
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-teal-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                            <Logo className="w-12 h-12 sm:w-12 sm:h-12 fill-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t('register_page.create_account_title')}</h1>
                    <p className="text-slate-400">{t('register_page.create_account_description')}</p>
                </div>

                {/* Register Form */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">
                                {t('register_page.username_label')}
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                    placeholder={t('register_page.username_placeholder')}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">
                                {t('register_page.email_label')}
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder={t('register_page.email_placeholder')}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">
                                {t('register_page.password_label')}
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder={t('register_page.password_placeholder')}
                                    className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors duration-300"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="space-y-2">
                                    <div className="flex space-x-1">
                                        {[...Array(5)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-slate-600'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-xs ${passwordStrength >= 3 ? 'text-green-400' : passwordStrength >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {t('register_page.password_strength_label')}: {t(`register_page.password_strength_levels.${strengthLabels[passwordStrength - 1].toLowerCase().replace(' ', '_')}`)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">
                                {t('register_page.confirm_password_label')}
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    placeholder={t('register_page.confirm_password_placeholder')}
                                    className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors duration-300"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Password Match Indicator */}
                            {formData.confirmPassword && (
                                <div className="flex items-center space-x-2">
                                    {formData.password === formData.confirmPassword ? (
                                        <>
                                            <Check className="w-4 h-4 text-green-400" />
                                            <span className="text-xs text-green-400">{t('register_page.passwords_match')}</span>
                                        </>
                                    ) : (
                                        <span className="text-xs text-red-400">{t('register_page.passwords_do_not_match')}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || formData.password !== formData.confirmPassword}
                            className={`
                w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform
                ${isLoading || formData.password !== formData.confirmPassword
                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white hover:scale-105 hover:shadow-2xl shadow-teal-500/25'
                                }
                focus:outline-none focus:ring-4 focus:ring-teal-500/50 focus:ring-offset-2 focus:ring-offset-slate-800
              `}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>{t('register_page.creating_account_button')}</span>
                                </>
                            ) : (
                                <span>{t('register_page.create_account_button')}</span>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-600/50"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-slate-800/50 text-slate-400">{t('register_page.or_continue_with')}</span>
                        </div>
                    </div>

                    {/* GitHub Login */}
                    <button
                        onClick={handleGithubLogin}
                        className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-slate-500/50 rounded-xl text-slate-100 font-medium transition-all duration-300 hover:scale-105"
                    >
                        <Github className="w-5 h-5" />
                        <span>{t('register_page.continue_with_github')}</span>
                    </button>

                    {/* Sign In Link */}
                    <div className="text-center mt-8 pt-6 border-t border-slate-700/50">
                        <p className="text-slate-400">
                            {t('register_page.already_have_account_question')}{' '}
                            <Link
                                to="/login"
                                className="text-teal-400 hover:text-teal-300 font-medium transition-colors duration-300"
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
                title="Registration Error"
                confirmText="OK"
                onConfirm={() => setIsErrorModalOpen(false)}
                confirmButtonClass="bg-blue-600 hover:bg-blue-700"
            >
                <p>{errorMessage}</p>
            </Modal>
        </div>
    );
}
