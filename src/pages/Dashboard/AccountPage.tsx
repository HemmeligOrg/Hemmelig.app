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
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {t('account_page.title')}
                </h1>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                    {t('account_page.description')}
                </p>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="border-b border-gray-200 dark:border-dark-600">
                    <nav className="flex space-x-8 overflow-x-auto">
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
                                    className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                                        activeTab === tab.id
                                            ? 'border-teal-500 text-teal-400'
                                            : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-600 dark:text-slate-300 hover:border-dark-500'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.name}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-2xl">
                {activeTab === 'profile' && (
                    <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-4">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-teal-500/20">
                                <User className="w-4 h-4 text-teal-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                    {t('account_page.profile_info.title')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {t('account_page.profile_info.description')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">
                                    {t('account_page.profile_info.username_label')}
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={profileData.username}
                                    onChange={handleProfileChange}
                                    className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">
                                    {t('account_page.profile_info.email_label')}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 w-4 h-4" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleProfileChange}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                    />
                                </div>
                            </div>

                            {profileError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                    {profileError}
                                </div>
                            )}

                            <div className="pt-3">
                                <button
                                    onClick={handleProfileSave}
                                    disabled={isLoading}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-gray-900 dark:text-white text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-4 h-4" />
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
                    <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-4">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-orange-500/20">
                                <Shield className="w-4 h-4 text-orange-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                    {t('account_page.security_settings.title')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {t('account_page.security_settings.description')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                    {t('account_page.security_settings.change_password_title')}
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">
                                            {t(
                                                'account_page.security_settings.current_password_label'
                                            )}
                                        </label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 w-4 h-4" />
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={passwordData.currentPassword}
                                                onChange={(e) =>
                                                    setPasswordData((prev) => ({
                                                        ...prev,
                                                        currentPassword: e.target.value,
                                                    }))
                                                }
                                                className={`w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-dark-700/50 border text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 ${passwordErrors.currentPassword ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-300 dark:border-dark-500/50 focus:ring-teal-500/50 focus:border-teal-500/50'}`}
                                                placeholder={t(
                                                    'account_page.security_settings.current_password_placeholder'
                                                )}
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowCurrentPassword(!showCurrentPassword)
                                                }
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-600 dark:text-slate-300"
                                            >
                                                {showCurrentPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        {passwordErrors.currentPassword && (
                                            <p className="text-xs text-red-400 mt-1">
                                                {passwordErrors.currentPassword}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">
                                            {t('account_page.security_settings.new_password_label')}
                                        </label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 w-4 h-4" />
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={passwordData.newPassword}
                                                onChange={(e) =>
                                                    setPasswordData((prev) => ({
                                                        ...prev,
                                                        newPassword: e.target.value,
                                                    }))
                                                }
                                                className={`w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-dark-700/50 border text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 ${passwordErrors.newPassword ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-300 dark:border-dark-500/50 focus:ring-teal-500/50 focus:border-teal-500/50'}`}
                                                placeholder={t(
                                                    'account_page.security_settings.new_password_placeholder'
                                                )}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-600 dark:text-slate-300"
                                            >
                                                {showNewPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        {passwordErrors.newPassword && (
                                            <p className="text-xs text-red-400 mt-1">
                                                {passwordErrors.newPassword}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">
                                            {t(
                                                'account_page.security_settings.confirm_new_password_label'
                                            )}
                                        </label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 w-4 h-4" />
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={passwordData.confirmPassword}
                                                onChange={(e) =>
                                                    setPasswordData((prev) => ({
                                                        ...prev,
                                                        confirmPassword: e.target.value,
                                                    }))
                                                }
                                                className={`w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-dark-700/50 border text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 ${passwordErrors.confirmPassword ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-300 dark:border-dark-500/50 focus:ring-teal-500/50 focus:border-teal-500/50'}`}
                                                placeholder={t(
                                                    'account_page.security_settings.confirm_new_password_placeholder'
                                                )}
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowConfirmPassword(!showConfirmPassword)
                                                }
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-600 dark:text-slate-300"
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        {passwordErrors.confirmPassword && (
                                            <p className="text-xs text-red-400 mt-1">
                                                {passwordErrors.confirmPassword}
                                            </p>
                                        )}
                                    </div>

                                    {passwordErrors.form && (
                                        <p className="text-xs text-red-400 my-2">
                                            {passwordErrors.form}
                                        </p>
                                    )}
                                    {successMessage && (
                                        <p className="text-xs text-teal-400 my-2">
                                            {successMessage}
                                        </p>
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
                                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-gray-900 dark:text-white text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Key className="w-4 h-4" />
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
                            <div className="border-t border-gray-200 dark:border-dark-600 pt-4 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                            {t('account_page.two_factor.title')}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            {t('account_page.two_factor.description')}
                                        </p>
                                    </div>
                                    {twoFactorEnabled ? (
                                        <span className="flex items-center space-x-1 text-xs text-green-400">
                                            <Check className="w-4 h-4" />
                                            <span>{t('account_page.two_factor.enabled')}</span>
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-500 dark:text-slate-400">
                                            {t('account_page.two_factor.disabled')}
                                        </span>
                                    )}
                                </div>

                                {!show2FASetup ? (
                                    <div className="flex space-x-2">
                                        {!twoFactorEnabled ? (
                                            <button
                                                onClick={() => setShow2FASetup(true)}
                                                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-gray-900 dark:text-white text-sm transition-all duration-300 hover:scale-105"
                                            >
                                                <Smartphone className="w-4 h-4" />
                                                <span>
                                                    {t('account_page.two_factor.setup_button')}
                                                </span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setIsDisable2FAModalOpen(true)}
                                                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm transition-all duration-300 hover:scale-105"
                                            >
                                                <Shield className="w-4 h-4" />
                                                <span>
                                                    {t('account_page.two_factor.disable_button')}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-100 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-500/50">
                                        {twoFAStep === 'password' && (
                                            <div className="space-y-4">
                                                <p className="text-sm text-gray-600 dark:text-slate-300">
                                                    {t(
                                                        'account_page.two_factor.enter_password_to_enable'
                                                    )}
                                                </p>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">
                                                        {t(
                                                            'account_page.security_settings.current_password_label'
                                                        )}
                                                    </label>
                                                    <div className="relative">
                                                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 w-4 h-4" />
                                                        <input
                                                            type="password"
                                                            value={twoFAPassword}
                                                            onChange={(e) =>
                                                                setTwoFAPassword(e.target.value)
                                                            }
                                                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                                                            placeholder={t(
                                                                'account_page.security_settings.current_password_placeholder'
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                                {twoFAError && (
                                                    <p className="text-xs text-red-400">
                                                        {twoFAError}
                                                    </p>
                                                )}
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={handleEnable2FA}
                                                        disabled={isLoading || !twoFAPassword}
                                                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-gray-900 dark:text-white text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span>
                                                            {isLoading
                                                                ? t('common.loading')
                                                                : t(
                                                                      'account_page.two_factor.continue'
                                                                  )}
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShow2FASetup(false);
                                                            reset2FAState();
                                                        }}
                                                        className="px-4 py-2 bg-gray-300 dark:bg-dark-600 text-gray-700 dark:text-slate-300 text-sm transition-all duration-300 hover:bg-gray-400 dark:hover:bg-dark-500"
                                                    >
                                                        {t('common.cancel')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {twoFAStep === 'qr' && totpUri && (
                                            <div className="space-y-4">
                                                <p className="text-sm text-gray-600 dark:text-slate-300">
                                                    {t('account_page.two_factor.scan_qr_code')}
                                                </p>
                                                <div className="flex justify-center p-4 bg-white">
                                                    <QRCodeSVG value={totpUri} size={200} />
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 text-center">
                                                    {t('account_page.two_factor.manual_entry_hint')}
                                                </p>
                                                <div className="p-2 bg-gray-200 dark:bg-dark-800 text-xs font-mono text-gray-700 dark:text-slate-300 break-all text-center">
                                                    {totpUri}
                                                </div>
                                                <button
                                                    onClick={() => setTwoFAStep('verify')}
                                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-gray-900 dark:text-white text-sm transition-all duration-300 hover:scale-105"
                                                >
                                                    <span>
                                                        {t('account_page.two_factor.continue')}
                                                    </span>
                                                </button>
                                            </div>
                                        )}

                                        {twoFAStep === 'verify' && (
                                            <div className="space-y-4">
                                                <p className="text-sm text-gray-600 dark:text-slate-300">
                                                    {t(
                                                        'account_page.two_factor.enter_verification_code'
                                                    )}
                                                </p>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">
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
                                                        className="w-full px-4 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300 text-center text-xl tracking-widest"
                                                        placeholder="000000"
                                                        maxLength={6}
                                                    />
                                                </div>
                                                {twoFAError && (
                                                    <p className="text-xs text-red-400">
                                                        {twoFAError}
                                                    </p>
                                                )}
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={handleVerify2FA}
                                                        disabled={
                                                            isLoading ||
                                                            twoFAVerifyCode.length !== 6
                                                        }
                                                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-gray-900 dark:text-white text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span>
                                                            {isLoading
                                                                ? t('common.loading')
                                                                : t(
                                                                      'account_page.two_factor.verify_and_enable'
                                                                  )}
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => setTwoFAStep('qr')}
                                                        className="px-4 py-2 bg-gray-300 dark:bg-dark-600 text-gray-700 dark:text-slate-300 text-sm transition-all duration-300 hover:bg-gray-400 dark:hover:bg-dark-500"
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
                    <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-purple-500/20">
                                    <Code className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                        {t('account_page.developer.title')}
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                        {t('account_page.developer.description')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateKeyModalOpen(true)}
                                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm transition-all duration-300 hover:scale-105"
                            >
                                <Plus className="w-4 h-4" />
                                <span>{t('account_page.developer.create_key')}</span>
                            </button>
                        </div>

                        {/* Newly created key warning */}
                        {newlyCreatedKey && (
                            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30">
                                <p className="text-sm font-medium text-yellow-300 mb-2">
                                    {t('account_page.developer.key_created')}
                                </p>
                                <p className="text-xs text-yellow-200/80 mb-2">
                                    {t('account_page.developer.key_warning')}
                                </p>
                                <div className="flex items-center space-x-2">
                                    <code className="flex-1 p-2 bg-dark-900/50 text-xs text-green-400 font-mono break-all">
                                        {newlyCreatedKey}
                                    </code>
                                    <button
                                        onClick={() =>
                                            handleCopyToClipboard(newlyCreatedKey, 'new')
                                        }
                                        className="p-2 bg-dark-700 hover:bg-dark-600 transition-colors"
                                    >
                                        {copiedKeyId === 'new' ? (
                                            <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                                <button
                                    onClick={() => setNewlyCreatedKey(null)}
                                    className="mt-2 text-xs text-yellow-400 hover:text-yellow-300"
                                >
                                    {t('account_page.developer.dismiss')}
                                </button>
                            </div>
                        )}

                        {/* API Keys list */}
                        <div className="space-y-3">
                            {apiKeys.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                                    <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">{t('account_page.developer.no_keys')}</p>
                                </div>
                            ) : (
                                apiKeys.map((apiKey) => (
                                    <div
                                        key={apiKey.id}
                                        className="p-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-500/50"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {apiKey.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                                                    {apiKey.keyPrefix}...
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteApiKey(apiKey.id)}
                                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-slate-400">
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
                                                            ? 'text-red-400'
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
                        <div className="mt-4 p-3 bg-gray-100 dark:bg-dark-700/30 border border-gray-200 dark:border-dark-500/30">
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                {t('account_page.developer.docs_hint')}{' '}
                                <a
                                    href="/api/docs"
                                    target="_blank"
                                    className="text-teal-400 hover:text-teal-300"
                                >
                                    {t('account_page.developer.api_docs')}
                                </a>
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'danger' && (
                    <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-red-500/30 p-4">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-red-500/20">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                    {t('account_page.danger_zone.title')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {t('account_page.danger_zone.description')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-red-500/10 border border-red-500/30">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-red-300 mb-2">
                                            {t('account_page.danger_zone.delete_account_title')}
                                        </h3>
                                        <p className="text-xs text-red-200/80 mb-3">
                                            {t(
                                                'account_page.danger_zone.delete_account_description'
                                            )}
                                        </p>
                                        <ul className="text-xs text-red-200/70 space-y-1 mb-3">
                                            <li>
                                                •{' '}
                                                {t(
                                                    'account_page.danger_zone.delete_account_bullet1'
                                                )}
                                            </li>
                                            <li>
                                                •{' '}
                                                {t(
                                                    'account_page.danger_zone.delete_account_bullet2'
                                                )}
                                            </li>
                                            <li>
                                                •{' '}
                                                {t(
                                                    'account_page.danger_zone.delete_account_bullet3'
                                                )}
                                            </li>
                                            <li>
                                                •{' '}
                                                {t(
                                                    'account_page.danger_zone.delete_account_bullet4'
                                                )}
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    disabled={isLoading}
                                    className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-gray-900 dark:text-white text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>
                                        {isLoading
                                            ? t('account_page.danger_zone.deleting_account_button')
                                            : t('account_page.danger_zone.delete_account_button')}
                                    </span>
                                </button>
                            </div>
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
                    {apiKeyError && <p className="text-xs text-red-400">{apiKeyError}</p>}
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
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-slate-300">
                        {t('account_page.two_factor.disable_warning')}
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">
                            {t('account_page.security_settings.current_password_label')}
                        </label>
                        <input
                            type="password"
                            value={disable2FAPassword}
                            onChange={(e) => setDisable2FAPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                            placeholder={t(
                                'account_page.security_settings.current_password_placeholder'
                            )}
                        />
                    </div>
                    {twoFAError && <p className="text-xs text-red-400">{twoFAError}</p>}
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
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-slate-300">
                        {t('account_page.two_factor.backup_codes_description')}
                    </p>
                    <div className="grid grid-cols-2 gap-2 p-4 bg-gray-100 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-500/50">
                        {backupCodes.map((code, index) => (
                            <code
                                key={index}
                                className="text-sm font-mono text-gray-900 dark:text-slate-100"
                            >
                                {code}
                            </code>
                        ))}
                    </div>
                    <p className="text-xs text-yellow-500">
                        {t('account_page.two_factor.backup_codes_warning')}
                    </p>
                </div>
            </Modal>
        </div>
    );
}
