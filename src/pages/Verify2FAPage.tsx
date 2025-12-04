import { ArrowLeft, Shield } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { authClient } from '../lib/auth';

export function Verify2FAPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newCode = [...code];
        for (let i = 0; i < pastedData.length; i++) {
            newCode[i] = pastedData[i];
        }
        setCode(newCode);
        if (pastedData.length === 6) {
            inputRefs.current[5]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const totpCode = code.join('');
        if (totpCode.length !== 6) return;

        setIsLoading(true);
        try {
            const { error } = await authClient.twoFactor.verifyTotp({
                code: totpCode,
            });

            if (error) {
                setErrorMessage(t('verify_2fa_page.invalid_code'));
                setIsErrorModalOpen(true);
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('2FA verification error:', error);
            setErrorMessage(t('verify_2fa_page.unexpected_error'));
            setIsErrorModalOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-light-800 dark:bg-dark-900 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Back to Login */}
                <Link
                    to="/login"
                    className="inline-flex items-center space-x-2 text-gray-500 dark:text-slate-400 hover:text-teal-400 transition-colors duration-300 mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                    <span>{t('verify_2fa_page.back_to_login')}</span>
                </Link>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('verify_2fa_page.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">
                        {t('verify_2fa_page.description')}
                    </p>
                </div>

                {/* 2FA Form */}
                <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6 shadow-xl">
                    <div className="flex justify-center mb-6">
                        <div className="p-3 bg-teal-500/20">
                            <Shield className="w-8 h-8 text-teal-400" />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Code Input */}
                        <div className="flex justify-center gap-2" onPaste={handlePaste}>
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => {
                                        inputRefs.current[index] = el;
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-xl font-semibold bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                />
                            ))}
                        </div>

                        <p className="text-center text-sm text-gray-500 dark:text-slate-400">
                            {t('verify_2fa_page.enter_code_hint')}
                        </p>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || code.join('').length !== 6}
                            className={`
                                w-full flex items-center justify-center space-x-3 py-2.5 px-4 font-semibold transition-all duration-300 transform
                                ${
                                    isLoading || code.join('').length !== 6
                                        ? 'bg-dark-600 text-gray-500 dark:text-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-gray-900 dark:text-white hover:scale-105 hover:shadow-2xl shadow-teal-500/25'
                                }
                                focus:outline-none focus:ring-4 focus:ring-teal-500/50 focus:ring-offset-2 focus:ring-offset-white dark:ring-offset-dark-800
                            `}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>{t('verify_2fa_page.verifying')}</span>
                                </>
                            ) : (
                                <span>{t('verify_2fa_page.verify_button')}</span>
                            )}
                        </button>
                    </form>
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
