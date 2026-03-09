import { Shield } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { LoadingButton } from '../components/LoadingButton';
import { useErrorModal } from '../hooks/useModalState';
import { authClient } from '../lib/auth';

export function Verify2FAPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const errorModal = useErrorModal();
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
                errorModal.showError(t('verify_2fa_page.invalid_code'));
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('2FA verification error:', error);
            errorModal.showError(t('verify_2fa_page.unexpected_error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthPageLayout
            title={t('verify_2fa_page.title')}
            subtitle={t('verify_2fa_page.description')}
            backTo="/login"
            backLabel={t('verify_2fa_page.back_to_login')}
            errorModal={errorModal}
        >
            <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6 shadow-xl">
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-teal-500/20">
                        <Shield className="w-8 h-8 text-teal-400" />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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

                    <LoadingButton
                        isLoading={isLoading}
                        disabled={code.join('').length !== 6}
                        loadingText={t('verify_2fa_page.verifying')}
                    >
                        <span>{t('verify_2fa_page.verify_button')}</span>
                    </LoadingButton>
                </form>
            </div>
        </AuthPageLayout>
    );
}
