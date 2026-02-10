import { Check, Eye, EyeOff, Key, Shield, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../components/Modal';
import { api } from '../../../lib/api';
import { authClient } from '../../../lib/auth';

interface SecurityTabProps {
    initialTwoFactorEnabled: boolean;
}

export function SecurityTab({ initialTwoFactorEnabled }: SecurityTabProps) {
    const { t } = useTranslation();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});
    const [successMessage, setSuccessMessage] = useState('');

    // 2FA state
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialTwoFactorEnabled);
    const [totpUri, setTotpUri] = useState<string | null>(null);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [show2FASetup, setShow2FASetup] = useState(false);
    const [twoFAPassword, setTwoFAPassword] = useState('');
    const [twoFAVerifyCode, setTwoFAVerifyCode] = useState('');
    const [twoFAError, setTwoFAError] = useState('');
    const [twoFAStep, setTwoFAStep] = useState<'password' | 'qr' | 'verify'>('password');
    const [isDisable2FAModalOpen, setIsDisable2FAModalOpen] = useState(false);
    const [disable2FAPassword, setDisable2FAPassword] = useState('');
    const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);

    const handlePasswordChange = async () => {
        setSuccessMessage('');
        setPasswordErrors({});

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordErrors({
                confirmPassword: t('account_page.security_settings.password_mismatch_alert'),
            });
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.account.password.$put({ json: passwordData });
            if (res.ok) {
                setSuccessMessage(t('account_page.security_settings.password_change_success'));
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const errorData = await res.json();
                if (errorData.error && errorData.error.issues) {
                    const newErrors: { [key: string]: string } = {};
                    errorData.error.issues.forEach(
                        (issue: { path: (string | number)[]; message: string }) => {
                            if (issue.path && issue.path.length > 0) {
                                newErrors[issue.path[0]] = issue.message;
                            }
                        }
                    );
                    setPasswordErrors(newErrors);
                } else {
                    setPasswordErrors({
                        form:
                            errorData.error ||
                            t('account_page.security_settings.password_change_error'),
                    });
                }
            }
        } catch (error) {
            console.error('An error occurred', error);
            setPasswordErrors({
                form:
                    error instanceof Error && error.message !== 'Unknown error'
                        ? error.message
                        : t('account_page.security_settings.password_change_error'),
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnable2FA = async () => {
        setTwoFAError('');
        setIsLoading(true);
        try {
            const { data, error } = await authClient.twoFactor.enable({
                password: twoFAPassword,
            });

            if (error) {
                setTwoFAError(error.message || t('account_page.two_factor.invalid_password'));
                return;
            }

            if (data?.totpURI) {
                setTotpUri(data.totpURI);
                setBackupCodes(data.backupCodes || []);
                setTwoFAStep('qr');
            }
        } catch (error) {
            console.error('Failed to enable 2FA:', error);
            setTwoFAError(t('account_page.two_factor.enable_error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        setTwoFAError('');
        setIsLoading(true);
        try {
            const { error } = await authClient.twoFactor.verifyTotp({
                code: twoFAVerifyCode,
            });

            if (error) {
                setTwoFAError(t('account_page.two_factor.invalid_code'));
                return;
            }

            setTwoFactorEnabled(true);
            setShow2FASetup(false);
            setShowBackupCodesModal(true);
            reset2FAState();
        } catch (error) {
            console.error('Failed to verify 2FA:', error);
            setTwoFAError(t('account_page.two_factor.verify_error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        setTwoFAError('');
        setIsLoading(true);
        try {
            const { error } = await authClient.twoFactor.disable({
                password: disable2FAPassword,
            });

            if (error) {
                setTwoFAError(t('account_page.two_factor.invalid_password'));
                return;
            }

            setTwoFactorEnabled(false);
            setIsDisable2FAModalOpen(false);
            setDisable2FAPassword('');
        } catch (error) {
            console.error('Failed to disable 2FA:', error);
            setTwoFAError(t('account_page.two_factor.disable_error'));
        } finally {
            setIsLoading(false);
        }
    };

    const reset2FAState = () => {
        setTwoFAPassword('');
        setTwoFAVerifyCode('');
        setTotpUri(null);
        setTwoFAStep('password');
        setTwoFAError('');
    };

    return (
        <>
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-4">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 bg-orange-500/10">
                        <Shield className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {t('account_page.security_settings.title')}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                            {t('account_page.security_settings.description')}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Password Change Section */}
                    <div>
                        <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-2.5">
                            {t('account_page.security_settings.change_password_title')}
                        </h3>
                        <div className="space-y-2.5">
                            <PasswordInput
                                label={t('account_page.security_settings.current_password_label')}
                                value={passwordData.currentPassword}
                                onChange={(value) =>
                                    setPasswordData((prev) => ({ ...prev, currentPassword: value }))
                                }
                                show={showCurrentPassword}
                                onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                                placeholder={t(
                                    'account_page.security_settings.current_password_placeholder'
                                )}
                                error={passwordErrors.currentPassword}
                            />

                            <PasswordInput
                                label={t('account_page.security_settings.new_password_label')}
                                value={passwordData.newPassword}
                                onChange={(value) =>
                                    setPasswordData((prev) => ({ ...prev, newPassword: value }))
                                }
                                show={showNewPassword}
                                onToggle={() => setShowNewPassword(!showNewPassword)}
                                placeholder={t(
                                    'account_page.security_settings.new_password_placeholder'
                                )}
                                error={passwordErrors.newPassword}
                            />

                            <PasswordInput
                                label={t(
                                    'account_page.security_settings.confirm_new_password_label'
                                )}
                                value={passwordData.confirmPassword}
                                onChange={(value) =>
                                    setPasswordData((prev) => ({ ...prev, confirmPassword: value }))
                                }
                                show={showConfirmPassword}
                                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                                placeholder={t(
                                    'account_page.security_settings.confirm_new_password_placeholder'
                                )}
                                error={passwordErrors.confirmPassword}
                            />

                            {passwordErrors.form && (
                                <p className="text-xs text-red-500">{passwordErrors.form}</p>
                            )}
                            {successMessage && (
                                <p className="text-xs text-teal-500">{successMessage}</p>
                            )}

                            <button
                                onClick={handlePasswordChange}
                                disabled={
                                    isLoading ||
                                    !passwordData.currentPassword ||
                                    !passwordData.newPassword ||
                                    passwordData.newPassword !== passwordData.confirmPassword
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Key className="w-3.5 h-3.5" />
                                <span>
                                    {isLoading
                                        ? t(
                                              'account_page.security_settings.changing_password_button'
                                          )
                                        : t(
                                              'account_page.security_settings.change_password_button'
                                          )}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Two-Factor Authentication Section */}
                    <div className="border-t border-gray-200 dark:border-dark-600 pt-4">
                        <div className="flex items-center justify-between mb-2.5">
                            <div>
                                <h3 className="text-xs font-medium text-gray-900 dark:text-white">
                                    {t('account_page.two_factor.title')}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {t('account_page.two_factor.description')}
                                </p>
                            </div>
                            {twoFactorEnabled ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-500">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{t('account_page.two_factor.enabled')}</span>
                                </span>
                            ) : (
                                <span className="text-xs text-gray-500 dark:text-slate-400">
                                    {t('account_page.two_factor.disabled')}
                                </span>
                            )}
                        </div>

                        {!show2FASetup ? (
                            <div className="flex gap-2">
                                {!twoFactorEnabled ? (
                                    <button
                                        onClick={() => setShow2FASetup(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors"
                                    >
                                        <Smartphone className="w-3.5 h-3.5" />
                                        <span>{t('account_page.two_factor.setup_button')}</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsDisable2FAModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors"
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        <span>{t('account_page.two_factor.disable_button')}</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <TwoFASetup
                                step={twoFAStep}
                                password={twoFAPassword}
                                setPassword={setTwoFAPassword}
                                verifyCode={twoFAVerifyCode}
                                setVerifyCode={setTwoFAVerifyCode}
                                totpUri={totpUri}
                                error={twoFAError}
                                isLoading={isLoading}
                                onEnable={handleEnable2FA}
                                onVerify={handleVerify2FA}
                                onCancel={() => {
                                    setShow2FASetup(false);
                                    reset2FAState();
                                }}
                                onBack={() => setTwoFAStep('qr')}
                                onContinue={() => setTwoFAStep('verify')}
                                t={t}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Disable 2FA Modal */}
            <Modal
                isOpen={isDisable2FAModalOpen}
                onClose={() => {
                    setIsDisable2FAModalOpen(false);
                    setDisable2FAPassword('');
                    setTwoFAError('');
                }}
                onConfirm={handleDisable2FA}
                title={t('account_page.two_factor.disable_title')}
                confirmText={t('account_page.two_factor.disable_button')}
                cancelText={t('common.cancel')}
                confirmButtonClass="bg-red-500 hover:bg-red-600"
            >
                <div className="space-y-3">
                    <p className="text-xs text-gray-600 dark:text-slate-300">
                        {t('account_page.two_factor.disable_warning')}
                    </p>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                            {t('account_page.security_settings.current_password_label')}
                        </label>
                        <input
                            type="password"
                            value={disable2FAPassword}
                            onChange={(e) => setDisable2FAPassword(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                            placeholder={t(
                                'account_page.security_settings.current_password_placeholder'
                            )}
                        />
                    </div>
                    {twoFAError && <p className="text-xs text-red-500">{twoFAError}</p>}
                </div>
            </Modal>

            {/* Backup Codes Modal */}
            <Modal
                isOpen={showBackupCodesModal}
                onClose={() => setShowBackupCodesModal(false)}
                onConfirm={() => setShowBackupCodesModal(false)}
                title={t('account_page.two_factor.backup_codes_title')}
                confirmText={t('account_page.two_factor.backup_codes_saved')}
            >
                <div className="space-y-3">
                    <p className="text-xs text-gray-600 dark:text-slate-300">
                        {t('account_page.two_factor.backup_codes_description')}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 p-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600">
                        {backupCodes.map((code, index) => (
                            <code
                                key={index}
                                className="text-xs font-mono text-gray-900 dark:text-slate-100"
                            >
                                {code}
                            </code>
                        ))}
                    </div>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        {t('account_page.two_factor.backup_codes_warning')}
                    </p>
                </div>
            </Modal>
        </>
    );
}

// Helper component for password inputs
function PasswordInput({
    label,
    value,
    onChange,
    show,
    onToggle,
    placeholder,
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    show: boolean;
    onToggle: () => void;
    placeholder: string;
    error?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                {label}
            </label>
            <div className="relative">
                <Key className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full pl-9 pr-9 py-2 text-sm bg-gray-50 dark:bg-dark-700 border text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 transition-colors ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 dark:border-dark-600 focus:ring-teal-500 focus:border-teal-500'}`}
                    placeholder={placeholder}
                />
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        </div>
    );
}

// Helper component for 2FA setup flow
function TwoFASetup({
    step,
    password,
    setPassword,
    verifyCode,
    setVerifyCode,
    totpUri,
    error,
    isLoading,
    onEnable,
    onVerify,
    onCancel,
    onBack,
    onContinue,
    t,
}: {
    step: 'password' | 'qr' | 'verify';
    password: string;
    setPassword: (v: string) => void;
    verifyCode: string;
    setVerifyCode: (v: string) => void;
    totpUri: string | null;
    error: string;
    isLoading: boolean;
    onEnable: () => void;
    onVerify: () => void;
    onCancel: () => void;
    onBack: () => void;
    onContinue: () => void;
    t: (key: string) => string;
}) {
    return (
        <div className="p-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600">
            {step === 'password' && (
                <div className="space-y-3">
                    <p className="text-xs text-gray-600 dark:text-slate-300">
                        {t('account_page.two_factor.enter_password_to_enable')}
                    </p>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                            {t('account_page.security_settings.current_password_label')}
                        </label>
                        <div className="relative">
                            <Key className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                                placeholder={t(
                                    'account_page.security_settings.current_password_placeholder'
                                )}
                            />
                        </div>
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <div className="flex gap-2">
                        <button
                            onClick={onEnable}
                            disabled={isLoading || !password}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading
                                ? t('common.loading')
                                : t('account_page.two_factor.continue')}
                        </button>
                        <button
                            onClick={onCancel}
                            className="px-3 py-1.5 bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-slate-300 text-xs font-medium transition-colors hover:bg-gray-300 dark:hover:bg-dark-500"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </div>
            )}

            {step === 'qr' && totpUri && (
                <div className="space-y-3">
                    <p className="text-xs text-gray-600 dark:text-slate-300">
                        {t('account_page.two_factor.scan_qr_code')}
                    </p>
                    <div className="flex justify-center p-3 bg-white">
                        <QRCodeSVG value={totpUri} size={160} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 text-center">
                        {t('account_page.two_factor.manual_entry_hint')}
                    </p>
                    <div className="p-2 bg-gray-100 dark:bg-dark-800 text-xs font-mono text-gray-700 dark:text-slate-300 break-all text-center">
                        {totpUri}
                    </div>
                    <button
                        onClick={onContinue}
                        className="w-full px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors"
                    >
                        {t('account_page.two_factor.continue')}
                    </button>
                </div>
            )}

            {step === 'verify' && (
                <div className="space-y-3">
                    <p className="text-xs text-gray-600 dark:text-slate-300">
                        {t('account_page.two_factor.enter_verification_code')}
                    </p>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                            {t('account_page.two_factor.verification_code')}
                        </label>
                        <input
                            type="text"
                            value={verifyCode}
                            onChange={(e) =>
                                setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                            }
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors text-center text-lg tracking-widest"
                            placeholder="000000"
                            maxLength={6}
                        />
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <div className="flex gap-2">
                        <button
                            onClick={onVerify}
                            disabled={isLoading || verifyCode.length !== 6}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading
                                ? t('common.loading')
                                : t('account_page.two_factor.verify_and_enable')}
                        </button>
                        <button
                            onClick={onBack}
                            className="px-3 py-1.5 bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-slate-300 text-xs font-medium transition-colors hover:bg-gray-300 dark:hover:bg-dark-500"
                        >
                            {t('account_page.two_factor.back')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
