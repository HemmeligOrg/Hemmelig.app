import {
    AlertTriangle,
    Check,
    Code,
    Copy,
    Eye,
    EyeOff,
    Key,
    Mail,
    Plus,
    Save,
    Shield,
    Smartphone,
    Trash2,
    User,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { Modal } from '../../components/Modal';
import { api } from '../../lib/api';
import { authClient } from '../../lib/auth';
import { useAccountStore } from '../../store/accountStore';
import { copyToClipboard as copyText } from '../../utils/clipboard';

export function AccountPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { profileData, setProfileData } = useAccountStore();
    const initialData = useLoaderData() as {
        username: string;
        email: string;
        twoFactorEnabled: boolean;
    };

    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'developer' | 'danger'>(
        'profile'
    );
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // API Keys state
    const [apiKeys, setApiKeys] = useState<
        Array<{
            id: string;
            name: string;
            keyPrefix: string;
            lastUsedAt: string | null;
            expiresAt: string | null;
            createdAt: string;
        }>
    >([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyExpiry, setNewKeyExpiry] = useState<number | undefined>(undefined);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
    const [apiKeyError, setApiKeyError] = useState('');
    const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});
    const [profileError, setProfileError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // 2FA state
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialData.twoFactorEnabled);
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

    useEffect(() => {
        setProfileData({ username: initialData.username, email: initialData.email });
    }, [initialData, setProfileData]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData({ ...profileData, [name]: value });
    };

    const handleProfileSave = async () => {
        setIsLoading(true);
        setProfileError('');
        try {
            const res = await api.account.$put({ json: profileData });
            if (res.ok) {
                const updatedData = await res.json();
                setProfileData(updatedData);
            } else if (res.status === 409) {
                setProfileError(t('account_page.profile_settings.username_taken'));
            } else {
                console.error('Failed to update profile');
            }
        } catch (error) {
            console.error('An error occurred', error);
        } finally {
            setIsLoading(false);
        }
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
            setPasswordErrors({ form: t('account_page.security_settings.password_change_error') });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsLoading(true);
        try {
            const res = await api.account.$delete();
            if (res.ok) {
                // Redirect to login page after successful deletion
                navigate('/login');
            } else {
                console.error('Failed to delete account');
            }
        } catch (error) {
            console.error('An error occurred', error);
        } finally {
            setIsLoading(false);
            setIsDeleteModalOpen(false);
        }
    };

    // API Keys handlers
    const fetchApiKeys = async () => {
        try {
            const res = await api['api-keys'].$get();
            if (res.ok) {
                const data = await res.json();
                setApiKeys(data);
            }
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'developer') {
            fetchApiKeys();
        }
    }, [activeTab]);

    const handleCreateApiKey = async () => {
        setApiKeyError('');
        if (!newKeyName.trim()) {
            setApiKeyError(t('account_page.developer.name_required'));
            return;
        }

        setIsLoading(true);
        try {
            const res = await api['api-keys'].$post({
                json: {
                    name: newKeyName,
                    expiresInDays: newKeyExpiry,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setNewlyCreatedKey(data.key);
                setNewKeyName('');
                setNewKeyExpiry(undefined);
                fetchApiKeys();
            } else {
                const errorData = await res.json();
                setApiKeyError(errorData.error || t('account_page.developer.create_error'));
            }
        } catch (error) {
            console.error('Failed to create API key:', error);
            setApiKeyError(t('account_page.developer.create_error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteApiKey = async (id: string) => {
        try {
            const res = await api['api-keys'][':id'].$delete({ param: { id } });
            if (res.ok) {
                fetchApiKeys();
            }
        } catch (error) {
            console.error('Failed to delete API key:', error);
        }
    };

    const handleCopyToClipboard = async (text: string, id: string) => {
        const success = await copyText(text);
        if (success) {
            setCopiedKeyId(id);
            setTimeout(() => setCopiedKeyId(null), 2000);
        }
    };

    // 2FA handlers
    const handleEnable2FA = async () => {
        setTwoFAError('');
        setIsLoading(true);
        try {
            const { data, error } = await authClient.twoFactor.enable({
                password: twoFAPassword,
            });

            if (error) {
                console.error('2FA enable error:', error);
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

    const tabs = [
        { id: 'profile', name: t('account_page.tabs.profile'), icon: User },
        { id: 'security', name: t('account_page.tabs.security'), icon: Shield },
        { id: 'developer', name: t('account_page.tabs.developer'), icon: Code },
        { id: 'danger', name: t('account_page.tabs.danger_zone'), icon: AlertTriangle },
    ];

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="mb-5">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {t('account_page.title')}
                </h1>
                <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">
                    {t('account_page.description')}
                </p>
            </div>

            {/* Tabs */}
            <div className="mb-5">
                <div className="border-b border-gray-200 dark:border-dark-600">
                    <nav className="flex space-x-6 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() =>
                                        setActiveTab(
                                            tab.id as
                                                | 'profile'
                                                | 'security'
                                                | 'developer'
                                                | 'danger'
                                        )
                                    }
                                    className={`flex items-center gap-1.5 py-2.5 px-0.5 border-b-2 font-medium text-xs whitespace-nowrap transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-teal-500 text-teal-500 dark:text-teal-400'
                                            : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{tab.name}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-xl">
                {activeTab === 'profile' && (
                    <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-4">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-1.5 bg-teal-500/10">
                                <User className="w-4 h-4 text-teal-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {t('account_page.profile_info.title')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {t('account_page.profile_info.description')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                                    {t('account_page.profile_info.username_label')}
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={profileData.username}
                                    onChange={handleProfileChange}
                                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                                    {t('account_page.profile_info.email_label')}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleProfileChange}
                                        className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {profileError && (
                                <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                                    {profileError}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    onClick={handleProfileSave}
                                    disabled={isLoading}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>
                                        {isLoading
                                            ? t('account_page.profile_info.saving_button')
                                            : t('account_page.profile_info.save_changes_button')}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
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
                            <div>
                                <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-2.5">
                                    {t('account_page.security_settings.change_password_title')}
                                </h3>
                                <div className="space-y-2.5">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                                            {t(
                                                'account_page.security_settings.current_password_label'
                                            )}
                                        </label>
                                        <div className="relative">
                                            <Key className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={passwordData.currentPassword}
                                                onChange={(e) =>
                                                    setPasswordData((prev) => ({
                                                        ...prev,
                                                        currentPassword: e.target.value,
                                                    }))
                                                }
                                                className={`w-full pl-9 pr-9 py-2 text-sm bg-gray-50 dark:bg-dark-700 border text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 transition-colors ${passwordErrors.currentPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 dark:border-dark-600 focus:ring-teal-500 focus:border-teal-500'}`}
                                                placeholder={t(
                                                    'account_page.security_settings.current_password_placeholder'
                                                )}
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowCurrentPassword(!showCurrentPassword)
                                                }
                                                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                                            >
                                                {showCurrentPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        {passwordErrors.currentPassword && (
                                            <p className="text-xs text-red-500 mt-0.5">
                                                {passwordErrors.currentPassword}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                                            {t('account_page.security_settings.new_password_label')}
                                        </label>
                                        <div className="relative">
                                            <Key className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={passwordData.newPassword}
                                                onChange={(e) =>
                                                    setPasswordData((prev) => ({
                                                        ...prev,
                                                        newPassword: e.target.value,
                                                    }))
                                                }
                                                className={`w-full pl-9 pr-9 py-2 text-sm bg-gray-50 dark:bg-dark-700 border text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 transition-colors ${passwordErrors.newPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 dark:border-dark-600 focus:ring-teal-500 focus:border-teal-500'}`}
                                                placeholder={t(
                                                    'account_page.security_settings.new_password_placeholder'
                                                )}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                                            >
                                                {showNewPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        {passwordErrors.newPassword && (
                                            <p className="text-xs text-red-500 mt-0.5">
                                                {passwordErrors.newPassword}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                                            {t(
                                                'account_page.security_settings.confirm_new_password_label'
                                            )}
                                        </label>
                                        <div className="relative">
                                            <Key className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={passwordData.confirmPassword}
                                                onChange={(e) =>
                                                    setPasswordData((prev) => ({
                                                        ...prev,
                                                        confirmPassword: e.target.value,
                                                    }))
                                                }
                                                className={`w-full pl-9 pr-9 py-2 text-sm bg-gray-50 dark:bg-dark-700 border text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 transition-colors ${passwordErrors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 dark:border-dark-600 focus:ring-teal-500 focus:border-teal-500'}`}
                                                placeholder={t(
                                                    'account_page.security_settings.confirm_new_password_placeholder'
                                                )}
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowConfirmPassword(!showConfirmPassword)
                                                }
                                                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        {passwordErrors.confirmPassword && (
                                            <p className="text-xs text-red-500 mt-0.5">
                                                {passwordErrors.confirmPassword}
                                            </p>
                                        )}
                                    </div>

                                    {passwordErrors.form && (
                                        <p className="text-xs text-red-500">
                                            {passwordErrors.form}
                                        </p>
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
                                            passwordData.newPassword !==
                                                passwordData.confirmPassword
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
                                                <span>
                                                    {t('account_page.two_factor.setup_button')}
                                                </span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setIsDisable2FAModalOpen(true)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors"
                                            >
                                                <Shield className="w-3.5 h-3.5" />
                                                <span>
                                                    {t('account_page.two_factor.disable_button')}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600">
                                        {twoFAStep === 'password' && (
                                            <div className="space-y-3">
                                                <p className="text-xs text-gray-600 dark:text-slate-300">
                                                    {t(
                                                        'account_page.two_factor.enter_password_to_enable'
                                                    )}
                                                </p>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                                                        {t(
                                                            'account_page.security_settings.current_password_label'
                                                        )}
                                                    </label>
                                                    <div className="relative">
                                                        <Key className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                                                        <input
                                                            type="password"
                                                            value={twoFAPassword}
                                                            onChange={(e) =>
                                                                setTwoFAPassword(e.target.value)
                                                            }
                                                            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                                                            placeholder={t(
                                                                'account_page.security_settings.current_password_placeholder'
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                                {twoFAError && (
                                                    <p className="text-xs text-red-500">
                                                        {twoFAError}
                                                    </p>
                                                )}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleEnable2FA}
                                                        disabled={isLoading || !twoFAPassword}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isLoading
                                                            ? t('common.loading')
                                                            : t('account_page.two_factor.continue')}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShow2FASetup(false);
                                                            reset2FAState();
                                                        }}
                                                        className="px-3 py-1.5 bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-slate-300 text-xs font-medium transition-colors hover:bg-gray-300 dark:hover:bg-dark-500"
                                                    >
                                                        {t('common.cancel')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {twoFAStep === 'qr' && totpUri && (
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
                                                    onClick={() => setTwoFAStep('verify')}
                                                    className="w-full px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors"
                                                >
                                                    {t('account_page.two_factor.continue')}
                                                </button>
                                            </div>
                                        )}

                                        {twoFAStep === 'verify' && (
                                            <div className="space-y-3">
                                                <p className="text-xs text-gray-600 dark:text-slate-300">
                                                    {t(
                                                        'account_page.two_factor.enter_verification_code'
                                                    )}
                                                </p>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                                                        {t(
                                                            'account_page.two_factor.verification_code'
                                                        )}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={twoFAVerifyCode}
                                                        onChange={(e) =>
                                                            setTwoFAVerifyCode(
                                                                e.target.value
                                                                    .replace(/\D/g, '')
                                                                    .slice(0, 6)
                                                            )
                                                        }
                                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors text-center text-lg tracking-widest"
                                                        placeholder="000000"
                                                        maxLength={6}
                                                    />
                                                </div>
                                                {twoFAError && (
                                                    <p className="text-xs text-red-500">
                                                        {twoFAError}
                                                    </p>
                                                )}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleVerify2FA}
                                                        disabled={
                                                            isLoading ||
                                                            twoFAVerifyCode.length !== 6
                                                        }
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isLoading
                                                            ? t('common.loading')
                                                            : t(
                                                                  'account_page.two_factor.verify_and_enable'
                                                              )}
                                                    </button>
                                                    <button
                                                        onClick={() => setTwoFAStep('qr')}
                                                        className="px-3 py-1.5 bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-slate-300 text-xs font-medium transition-colors hover:bg-gray-300 dark:hover:bg-dark-500"
                                                    >
                                                        {t('account_page.two_factor.back')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'developer' && (
                    <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-purple-500/10">
                                    <Code className="w-4 h-4 text-purple-500" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {t('account_page.developer.title')}
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                        {t('account_page.developer.description')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateKeyModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{t('account_page.developer.create_key')}</span>
                            </button>
                        </div>

                        {/* Newly created key warning */}
                        {newlyCreatedKey && (
                            <div className="mb-3 p-2.5 bg-yellow-500/10 border border-yellow-500/20">
                                <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                                    {t('account_page.developer.key_created')}
                                </p>
                                <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80 mb-2">
                                    {t('account_page.developer.key_warning')}
                                </p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 p-1.5 bg-gray-900/50 dark:bg-dark-900 text-xs text-green-500 font-mono break-all">
                                        {newlyCreatedKey}
                                    </code>
                                    <button
                                        onClick={() =>
                                            handleCopyToClipboard(newlyCreatedKey, 'new')
                                        }
                                        className="p-1.5 bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors"
                                    >
                                        {copiedKeyId === 'new' ? (
                                            <Check className="w-3.5 h-3.5 text-green-500" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5 text-gray-500" />
                                        )}
                                    </button>
                                </div>
                                <button
                                    onClick={() => setNewlyCreatedKey(null)}
                                    className="mt-1.5 text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
                                >
                                    {t('account_page.developer.dismiss')}
                                </button>
                            </div>
                        )}

                        {/* API Keys list */}
                        <div className="space-y-2">
                            {apiKeys.length === 0 ? (
                                <div className="text-center py-6 text-gray-500 dark:text-slate-400">
                                    <Key className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                                    <p className="text-xs">{t('account_page.developer.no_keys')}</p>
                                </div>
                            ) : (
                                apiKeys.map((apiKey) => (
                                    <div
                                        key={apiKey.id}
                                        className="p-2.5 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-gray-900 dark:text-white">
                                                    {apiKey.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                                                    {apiKey.keyPrefix}...
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteApiKey(apiKey.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-500/10 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                                            <span>
                                                {t('account_page.developer.created')}:{' '}
                                                {new Date(apiKey.createdAt).toLocaleDateString()}
                                            </span>
                                            {apiKey.lastUsedAt && (
                                                <span>
                                                    {t('account_page.developer.last_used')}:{' '}
                                                    {new Date(
                                                        apiKey.lastUsedAt
                                                    ).toLocaleDateString()}
                                                </span>
                                            )}
                                            {apiKey.expiresAt && (
                                                <span
                                                    className={
                                                        new Date(apiKey.expiresAt) < new Date()
                                                            ? 'text-red-500'
                                                            : ''
                                                    }
                                                >
                                                    {t('account_page.developer.expires')}:{' '}
                                                    {new Date(
                                                        apiKey.expiresAt
                                                    ).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* API Documentation link */}
                        <div className="mt-3 p-2.5 bg-gray-50 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-600">
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                {t('account_page.developer.docs_hint')}{' '}
                                <a
                                    href="/api/docs"
                                    target="_blank"
                                    className="text-teal-500 hover:underline"
                                >
                                    {t('account_page.developer.api_docs')}
                                </a>
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'danger' && (
                    <div className="bg-white dark:bg-dark-800 border border-red-500/30 p-4">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-1.5 bg-red-500/10">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {t('account_page.danger_zone.title')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {t('account_page.danger_zone.description')}
                                </p>
                            </div>
                        </div>

                        <div className="p-3 bg-red-500/5 border border-red-500/20">
                            <h3 className="text-xs font-medium text-red-500 mb-1.5">
                                {t('account_page.danger_zone.delete_account_title')}
                            </h3>
                            <p className="text-xs text-red-400/80 mb-2">
                                {t('account_page.danger_zone.delete_account_description')}
                            </p>
                            <ul className="text-xs text-red-400/70 space-y-0.5 mb-3">
                                <li>• {t('account_page.danger_zone.delete_account_bullet1')}</li>
                                <li>• {t('account_page.danger_zone.delete_account_bullet2')}</li>
                                <li>• {t('account_page.danger_zone.delete_account_bullet3')}</li>
                                <li>• {t('account_page.danger_zone.delete_account_bullet4')}</li>
                            </ul>
                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>
                                    {isLoading
                                        ? t('account_page.danger_zone.deleting_account_button')
                                        : t('account_page.danger_zone.delete_account_button')}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteAccount}
                title={t('account_page.danger_zone.delete_account_title')}
                confirmText={t('account_page.danger_zone.delete_account_button')}
                cancelText={t('secrets_page.table.delete_cancel_button')}
            >
                <p>{t('account_page.danger_zone.delete_account_confirm')}</p>
            </Modal>
            <Modal
                isOpen={isCreateKeyModalOpen}
                onClose={() => {
                    setIsCreateKeyModalOpen(false);
                    setNewKeyName('');
                    setNewKeyExpiry(undefined);
                    setApiKeyError('');
                }}
                onConfirm={handleCreateApiKey}
                title={t('account_page.developer.create_key_title')}
                confirmText={t('account_page.developer.create_button')}
                cancelText={t('secrets_page.table.delete_cancel_button')}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">
                            {t('account_page.developer.key_name')}
                        </label>
                        <input
                            type="text"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            placeholder={t('account_page.developer.key_name_placeholder')}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">
                            {t('account_page.developer.expiration')}
                        </label>
                        <select
                            value={newKeyExpiry || ''}
                            onChange={(e) =>
                                setNewKeyExpiry(
                                    e.target.value ? parseInt(e.target.value) : undefined
                                )
                            }
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                        >
                            <option value="">{t('account_page.developer.never_expires')}</option>
                            <option value="30">
                                {t('account_page.developer.expires_30_days')}
                            </option>
                            <option value="90">
                                {t('account_page.developer.expires_90_days')}
                            </option>
                            <option value="365">
                                {t('account_page.developer.expires_1_year')}
                            </option>
                        </select>
                    </div>
                    {apiKeyError && <p className="text-xs text-red-500">{apiKeyError}</p>}
                </div>
            </Modal>
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
        </div>
    );
}
