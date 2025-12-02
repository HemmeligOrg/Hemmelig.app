import { useEffect, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Mail,
  Key,
  Shield,
  Save,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAccountStore } from '../../store/accountStore';
import { Modal } from '../../components/Modal';

export function AccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profileData, setProfileData } = useAccountStore();
  const initialData = useLoaderData() as { username: string, email: string };

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'danger'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setProfileData(initialData);
  }, [initialData, setProfileData]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleProfileSave = async () => {
    setIsLoading(true);
    try {
      const res = await api.account.$put({ json: profileData });
      if (res.ok) {
        const updatedData = await res.json();
        setProfileData(updatedData);
      } else {
        console.error("Failed to update profile");
      }
    } catch (error) {
      console.error("An error occurred", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setSuccessMessage('');
    setPasswordErrors({});

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrors({ confirmPassword: t('account_page.security_settings.password_mismatch_alert') });
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
          errorData.error.issues.forEach((issue: { path: (string | number)[]; message: string; }) => {
            if (issue.path && issue.path.length > 0) {
              newErrors[issue.path[0]] = issue.message;
            }
          });
          setPasswordErrors(newErrors);
        } else {
          setPasswordErrors({ form: errorData.error || t('account_page.security_settings.password_change_error') });
        }
      }
    } catch (error) {
      console.error("An error occurred", error);
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
        console.error("Failed to delete account");
      }
    } catch (error) {
      console.error("An error occurred", error);
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  const tabs = [
    { id: 'profile', name: t('account_page.tabs.profile'), icon: User },
    { id: 'security', name: t('account_page.tabs.security'), icon: Shield },
    { id: 'danger', name: t('account_page.tabs.danger_zone'), icon: AlertTriangle },
  ];

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('account_page.title')}</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{t('account_page.description')}</p>
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
                  onClick={() => setActiveTab(tab.id as 'profile' | 'security' | 'danger')}
                  className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${activeTab === tab.id
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
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('account_page.profile_info.title')}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">{t('account_page.profile_info.description')}</p>
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

              <div className="pt-3">
                <button
                  onClick={handleProfileSave}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-gray-900 dark:text-white text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{isLoading ? t('account_page.profile_info.saving_button') : t('account_page.profile_info.save_changes_button')}</span>
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
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('account_page.security_settings.title')}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">{t('account_page.security_settings.description')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">{t('account_page.security_settings.change_password_title')}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">
                      {t('account_page.security_settings.current_password_label')}
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 w-4 h-4" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className={`w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-dark-700/50 border text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 ${passwordErrors.currentPassword ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-300 dark:border-dark-500/50 focus:ring-teal-500/50 focus:border-teal-500/50'}`}
                        placeholder={t('account_page.security_settings.current_password_placeholder')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-600 dark:text-slate-300"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && <p className="text-xs text-red-400 mt-1">{passwordErrors.currentPassword}</p>}
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
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className={`w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-dark-700/50 border text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 ${passwordErrors.newPassword ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-300 dark:border-dark-500/50 focus:ring-teal-500/50 focus:border-teal-500/50'}`}
                        placeholder={t('account_page.security_settings.new_password_placeholder')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-600 dark:text-slate-300"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordErrors.newPassword && <p className="text-xs text-red-400 mt-1">{passwordErrors.newPassword}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">
                      {t('account_page.security_settings.confirm_new_password_label')}
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 w-4 h-4" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className={`w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-dark-700/50 border text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 ${passwordErrors.confirmPassword ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-300 dark:border-dark-500/50 focus:ring-teal-500/50 focus:border-teal-500/50'}`}
                        placeholder={t('account_page.security_settings.confirm_new_password_placeholder')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-600 dark:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && <p className="text-xs text-red-400 mt-1">{passwordErrors.confirmPassword}</p>}
                  </div>

                  {passwordErrors.form && <p className="text-xs text-red-400 my-2">{passwordErrors.form}</p>}
                  {successMessage && <p className="text-xs text-teal-400 my-2">{successMessage}</p>}

                  <button
                    onClick={handlePasswordChange}
                    disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-gray-900 dark:text-white text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Key className="w-4 h-4" />
                    <span>{isLoading ? t('account_page.security_settings.changing_password_button') : t('account_page.security_settings.change_password_button')}</span>
                  </button>
                </div>
              </div>
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
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('account_page.danger_zone.title')}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">{t('account_page.danger_zone.description')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-red-500/10 border border-red-500/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-300 mb-2">{t('account_page.danger_zone.delete_account_title')}</h3>
                    <p className="text-xs text-red-200/80 mb-3">
                      {t('account_page.danger_zone.delete_account_description')}
                    </p>
                    <ul className="text-xs text-red-200/70 space-y-1 mb-3">
                      <li>• {t('account_page.danger_zone.delete_account_bullet1')}</li>
                      <li>• {t('account_page.danger_zone.delete_account_bullet2')}</li>
                      <li>• {t('account_page.danger_zone.delete_account_bullet3')}</li>
                      <li>• {t('account_page.danger_zone.delete_account_bullet4')}</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-gray-900 dark:text-white text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isLoading ? t('account_page.danger_zone.deleting_account_button') : t('account_page.danger_zone.delete_account_button')}</span>
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
    </div>
  );
}
