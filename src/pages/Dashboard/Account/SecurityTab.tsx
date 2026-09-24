import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button';
import { Field, Input } from '../../../components/Input';
import { Modal } from '../../../components/Modal';
import { PasswordToggle } from '../../../components/PasswordToggle';
import { SettingRow, SettingsFooter, SettingsPanel } from '../../../components/Settings';
import { api } from '../../../lib/api';
import { authClient } from '../../../lib/auth';

interface SecurityTabProps {
    initialTwoFactorEnabled: boolean;
}

type TwoFAStep = 'password' | 'qr';

/** Returns the secret from an otpauth URI for manual entry. Falls back to the full URI. */
const totpSecret = (uri: string) => {
    try {
        return new URL(uri).searchParams.get('secret') ?? uri;
    } catch {
        return uri;
    }
};

export function SecurityTab({ initialTwoFactorEnabled }: SecurityTabProps) {
    const { t } = useTranslation();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [is2FALoading, setIs2FALoading] = useState(false);

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
    const [twoFAStep, setTwoFAStep] = useState<TwoFAStep>('password');
    const [isDisable2FAModalOpen, setIsDisable2FAModalOpen] = useState(false);
    const [disable2FAPassword, setDisable2FAPassword] = useState('');
    const [showBackupCodes, setShowBackupCodes] = useState(false);

    const updatePassword = (field: keyof typeof passwordData, value: string) => {
        setPasswordData((prev) => ({ ...prev, [field]: value }));
        setSuccessMessage('');
    };

    const handlePasswordChange = async () => {
        setSuccessMessage('');
        setPasswordErrors({});

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordErrors({
                confirmPassword: t('account_page.security_settings.password_mismatch_alert'),
            });
            return;
        }

        setIsPasswordLoading(true);
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
            setIsPasswordLoading(false);
        }
    };

    const handleEnable2FA = async () => {
        setTwoFAError('');
        setIs2FALoading(true);
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
            setIs2FALoading(false);
        }
    };

    const handleVerify2FA = async () => {
        setTwoFAError('');
        setIs2FALoading(true);
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
            setShowBackupCodes(true);
            reset2FAState();
        } catch (error) {
            console.error('Failed to verify 2FA:', error);
            setTwoFAError(t('account_page.two_factor.verify_error'));
        } finally {
            setIs2FALoading(false);
        }
    };

    const handleDisable2FA = async () => {
        setTwoFAError('');
        setIs2FALoading(true);
        try {
            const { error } = await authClient.twoFactor.disable({
                password: disable2FAPassword,
            });

            if (error) {
                setTwoFAError(t('account_page.two_factor.invalid_password'));
                return;
            }

            setTwoFactorEnabled(false);
            setShowBackupCodes(false);
            setBackupCodes([]);
            setIsDisable2FAModalOpen(false);
            setDisable2FAPassword('');
        } catch (error) {
            console.error('Failed to disable 2FA:', error);
            setTwoFAError(t('account_page.two_factor.disable_error'));
        } finally {
            setIs2FALoading(false);
        }
    };

    const reset2FAState = () => {
        setTwoFAPassword('');
        setTwoFAVerifyCode('');
        setTotpUri(null);
        setTwoFAStep('password');
        setTwoFAError('');
    };

    const cancel2FASetup = () => {
        setShow2FASetup(false);
        setBackupCodes([]);
        reset2FAState();
    };

    const dismissBackupCodes = () => {
        setShowBackupCodes(false);
        setBackupCodes([]);
    };

    const passwordNote = passwordErrors.form || successMessage;

    return (
        <>
            <SettingsPanel>
                <PasswordRow
                    label={t('account_page.security_settings.current_password_label')}
                    value={passwordData.currentPassword}
                    onChange={(value) => updatePassword('currentPassword', value)}
                    show={showCurrentPassword}
                    onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                    placeholder={t('account_page.security_settings.current_password_placeholder')}
                    autoComplete="current-password"
                    error={passwordErrors.currentPassword}
                />
                <PasswordRow
                    label={t('account_page.security_settings.new_password_label')}
                    description={t('account_page.security_settings.new_password_description')}
                    value={passwordData.newPassword}
                    onChange={(value) => updatePassword('newPassword', value)}
                    show={showNewPassword}
                    onToggle={() => setShowNewPassword(!showNewPassword)}
                    placeholder={t('account_page.security_settings.new_password_placeholder')}
                    autoComplete="new-password"
                    error={passwordErrors.newPassword}
                />
                <PasswordRow
                    label={t('account_page.security_settings.confirm_new_password_label')}
                    value={passwordData.confirmPassword}
                    onChange={(value) => updatePassword('confirmPassword', value)}
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                    placeholder={t(
                        'account_page.security_settings.confirm_new_password_placeholder'
                    )}
                    autoComplete="new-password"
                    error={passwordErrors.confirmPassword}
                />
                <SettingsFooter
                    note={passwordNote}
                    tone={passwordErrors.form ? 'danger' : successMessage ? 'accent' : 'muted'}
                >
                    <Button
                        variant="primary"
                        onClick={handlePasswordChange}
                        loading={isPasswordLoading}
                        disabled={
                            !passwordData.currentPassword ||
                            !passwordData.newPassword ||
                            passwordData.newPassword !== passwordData.confirmPassword
                        }
                    >
                        {t('account_page.security_settings.change_password_button')}
                    </Button>
                </SettingsFooter>
            </SettingsPanel>

            <div className="border border-line-soft rounded-md max-w-content overflow-hidden">
                <div className="flex flex-wrap gap-x-6 gap-y-3 justify-between items-center px-4.5 py-4">
                    <div>
                        <div className="text-sm">{t('account_page.two_factor.title')}</div>
                        <div className="text-ui text-muted">
                            {twoFactorEnabled
                                ? t('account_page.two_factor.status_on')
                                : t('account_page.two_factor.status_off')}
                        </div>
                    </div>
                    {twoFactorEnabled ? (
                        <Button
                            variant="danger"
                            size="md"
                            className="border border-danger"
                            onClick={() => setIsDisable2FAModalOpen(true)}
                        >
                            {t('account_page.two_factor.disable')}
                        </Button>
                    ) : show2FASetup ? (
                        <Button variant="secondary" onClick={cancel2FASetup}>
                            {t('common.cancel')}
                        </Button>
                    ) : (
                        <Button variant="secondary" onClick={() => setShow2FASetup(true)}>
                            {t('account_page.two_factor.enable')}
                        </Button>
                    )}
                </div>

                {show2FASetup && twoFAStep === 'password' && (
                    <div className="border-t border-line-soft p-4.5 grid gap-3">
                        <span className="text-ui text-muted">
                            {t('account_page.two_factor.enter_password_to_enable')}
                        </span>
                        <div className="flex flex-wrap gap-2 max-w-md">
                            <Input
                                type="password"
                                value={twoFAPassword}
                                onChange={(e) => setTwoFAPassword(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && twoFAPassword && handleEnable2FA()
                                }
                                placeholder={t(
                                    'account_page.security_settings.current_password_placeholder'
                                )}
                                aria-label={t(
                                    'account_page.security_settings.current_password_label'
                                )}
                                autoComplete="current-password"
                                autoFocus
                                className="flex-1 min-w-[200px]"
                            />
                            <Button
                                variant="primary"
                                onClick={handleEnable2FA}
                                loading={is2FALoading}
                                disabled={!twoFAPassword}
                            >
                                {t('account_page.two_factor.continue')}
                            </Button>
                        </div>
                        {twoFAError && <span className="text-ui text-danger">{twoFAError}</span>}
                    </div>
                )}

                {show2FASetup && twoFAStep === 'qr' && totpUri && (
                    <div className="border-t border-line-soft p-4.5 flex flex-wrap gap-6 items-center">
                        <div className="flex-none w-37 h-37 border border-line rounded-sm bg-white grid place-items-center">
                            <QRCodeSVG value={totpUri} size={124} />
                        </div>
                        <div className="grid gap-2.5 flex-[1_1_240px] min-w-0">
                            <span className="text-ui text-muted">
                                {t('account_page.two_factor.scan_and_verify')}
                            </span>
                            <div className="grid gap-0.5">
                                <span className="text-xs text-faint">
                                    {t('account_page.two_factor.manual_entry_hint')}
                                </span>
                                <code className="font-mono text-xs text-fg-3 break-all">
                                    {totpSecret(totpUri)}
                                </code>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-35">
                                    <Input
                                        mono
                                        controlSize="lg"
                                        value={twoFAVerifyCode}
                                        onChange={(e) =>
                                            setTwoFAVerifyCode(
                                                e.target.value.replace(/\D/g, '').slice(0, 6)
                                            )
                                        }
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' &&
                                            twoFAVerifyCode.length === 6 &&
                                            handleVerify2FA()
                                        }
                                        placeholder="000000"
                                        maxLength={6}
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        aria-label={t('account_page.two_factor.verification_code')}
                                        className="tracking-[0.3em]"
                                    />
                                </div>
                                <Button
                                    variant="primary"
                                    onClick={handleVerify2FA}
                                    loading={is2FALoading}
                                    disabled={twoFAVerifyCode.length !== 6}
                                >
                                    {t('account_page.two_factor.verify_button')}
                                </Button>
                            </div>
                            {twoFAError && (
                                <span className="text-ui text-danger">{twoFAError}</span>
                            )}
                        </div>
                    </div>
                )}

                {showBackupCodes && backupCodes.length > 0 && (
                    <div className="border-t border-line-soft p-4.5 grid gap-2.5">
                        <span className="text-ui text-warn">
                            {t('account_page.two_factor.backup_codes_shown_once')}
                        </span>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
                            {backupCodes.map((code) => (
                                <code
                                    key={code}
                                    className="font-mono text-ui px-2.5 py-1.5 bg-surface rounded-sm"
                                >
                                    {code}
                                </code>
                            ))}
                        </div>
                        <Button
                            variant="link"
                            size="inline"
                            className="justify-self-start"
                            onClick={dismissBackupCodes}
                        >
                            {t('account_page.two_factor.backup_codes_saved')}
                        </Button>
                    </div>
                )}
            </div>

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
            >
                <div className="grid gap-3">
                    <p className="m-0">{t('account_page.two_factor.disable_warning')}</p>
                    <Field label={t('account_page.security_settings.current_password_label')}>
                        <Input
                            type="password"
                            value={disable2FAPassword}
                            onChange={(e) => setDisable2FAPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleDisable2FA()}
                            placeholder={t(
                                'account_page.security_settings.current_password_placeholder'
                            )}
                            autoComplete="current-password"
                        />
                    </Field>
                    {twoFAError && <p className="m-0 text-ui text-danger">{twoFAError}</p>}
                </div>
            </Modal>
        </>
    );
}

interface PasswordRowProps {
    label: string;
    description?: string;
    value: string;
    onChange: (value: string) => void;
    show: boolean;
    onToggle: () => void;
    placeholder: string;
    autoComplete: string;
    error?: string;
}

/** A settings row with a password input, a show toggle and an error line. */
function PasswordRow({
    label,
    description,
    value,
    onChange,
    show,
    onToggle,
    placeholder,
    autoComplete,
    error,
}: PasswordRowProps) {
    const { t } = useTranslation();

    return (
        <SettingRow label={label} description={description}>
            <div className="w-full grid gap-1">
                <div className="relative">
                    <Input
                        mono
                        type={show ? 'text' : 'password'}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        autoComplete={autoComplete}
                        invalid={!!error}
                        aria-label={label}
                        className="pr-9"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex">
                        <PasswordToggle
                            visible={show}
                            onToggle={onToggle}
                            label={
                                show
                                    ? t('account_page.security_settings.hide_password')
                                    : t('account_page.security_settings.show_password')
                            }
                        />
                    </div>
                </div>
                {error && <span className="text-xs text-danger">{error}</span>}
            </div>
        </SettingRow>
    );
}
