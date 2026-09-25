import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingButton } from '../components/LoadingButton';
import { useErrorModal } from '../hooks/useModalState';
import { authClient } from '../lib/auth';

type CodeMode = 'totp' | 'backup';

interface LoginLocationState {
    requireAccount?: boolean;
}

export function Verify2FAPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [mode, setMode] = useState<CodeMode>('totp');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const errorModal = useErrorModal();

    // The login page passes this state on when the user came from the home page.
    const requireAccount = !!(location.state as LoginLocationState | null)?.requireAccount;
    const isTotp = mode === 'totp';
    const isComplete = isTotp ? code.length === 6 : code.trim().length > 0;

    const handleChange = (value: string) => {
        // A TOTP code has 6 digits. A backup code has letters, digits and a dash.
        setCode(isTotp ? value.replace(/\D/g, '').slice(0, 6) : value.trim());
    };

    const switchMode = () => {
        setMode(isTotp ? 'backup' : 'totp');
        setCode('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isComplete) return;

        setIsLoading(true);
        try {
            const { error } = isTotp
                ? await authClient.twoFactor.verifyTotp({ code })
                : await authClient.twoFactor.verifyBackupCode({ code });

            if (error) {
                errorModal.showError(
                    isTotp
                        ? t('verify_2fa_page.invalid_code')
                        : t('verify_2fa_page.invalid_backup_code')
                );
            } else {
                navigate(requireAccount ? '/' : '/dashboard');
            }
        } catch (error) {
            console.error('2FA verification error:', error);
            errorModal.showError(t('verify_2fa_page.unexpected_error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthPageLayout title={t('verify_2fa_page.title')} errorModal={errorModal}>
            <p className="m-0 text-sm text-fg-3">
                {isTotp
                    ? t('verify_2fa_page.description')
                    : t('verify_2fa_page.backup_description')}
            </p>

            <form onSubmit={handleSubmit} className="grid gap-4">
                {isTotp ? (
                    <Input
                        value={code}
                        onChange={(e) => handleChange(e.target.value)}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        maxLength={6}
                        aria-label={t('verify_2fa_page.code_label')}
                        autoFocus
                        mono
                        className="py-3! text-2xl! tracking-[0.4em] text-center"
                    />
                ) : (
                    <Input
                        value={code}
                        onChange={(e) => handleChange(e.target.value)}
                        autoComplete="one-time-code"
                        placeholder="xxxxx-xxxxx"
                        aria-label={t('verify_2fa_page.backup_code_label')}
                        autoFocus
                        mono
                        className="py-3! text-lg! tracking-widest text-center"
                    />
                )}

                <LoadingButton
                    isLoading={isLoading}
                    disabled={!isComplete}
                    loadingText={t('verify_2fa_page.verifying')}
                >
                    {t('verify_2fa_page.verify_button')}
                </LoadingButton>
            </form>

            <Button
                variant="ghost"
                size="inline"
                className="justify-self-start"
                onClick={switchMode}
            >
                {isTotp ? t('verify_2fa_page.use_backup_code') : t('verify_2fa_page.use_totp_code')}
            </Button>
        </AuthPageLayout>
    );
}
