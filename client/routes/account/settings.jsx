import { IconAt, IconEdit, IconKey, IconLink, IconToggleLeft, IconWorldWww } from '@tabler/icons-react';
import { useEffect, useState } from 'react'; // Import useEffect
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';

import { getSsoSettings, updateSsoSettings, updateSettings } from '../../api/settings'; // Import SSO settings functions
import ErrorBox from '../../components/error-box';
import SuccessBox from '../../components/success-box';
import useSettingsStore from '../../stores/settingsStore';

const Settings = () => {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const { t } = useTranslation();
    const adminSettings = useLoaderData();
    const { setSettings } = useSettingsStore();

    const [formData, setFormData] = useState(adminSettings);
    const [ssoFormData, setSsoFormData] = useState({
        sso_client_id: '',
        sso_client_secret: '',
        sso_authorization_url: '',
        sso_token_url: '',
        sso_user_info_url: '',
        sso_enabled: false,
    });
    const [ssoSuccess, setSsoSuccess] = useState(false);
    const [ssoError, setSsoError] = useState(null);

    // Fetch SSO settings on component mount
    useEffect(() => {
        const fetchSsoData = async () => {
            try {
                const ssoData = await getSsoSettings();
                if (ssoData && !ssoData.error) {
                    setSsoFormData({
                        sso_client_id: ssoData.sso_client_id || '',
                        sso_client_secret: ssoData.sso_client_secret || '',
                        sso_authorization_url: ssoData.sso_authorization_url || '',
                        sso_token_url: ssoData.sso_token_url || '',
                        sso_user_info_url: ssoData.sso_user_info_url || '',
                        sso_enabled: ssoData.sso_enabled || false,
                    });
                } else {
                    setSsoError(ssoData.error || t('settings.sso.fetch_error'));
                }
            } catch (err) {
                setSsoError(err.toString());
            }
        };
        fetchSsoData();
    }, [t]);

    const onUpdateSettings = async (e) => {
        e.preventDefault();

        try {
            // Exclude SSO fields from general settings update
            const generalSettingsData = { ...formData };
            delete generalSettingsData.sso_client_id;
            delete generalSettingsData.sso_client_secret;
            delete generalSettingsData.sso_authorization_url;
            delete generalSettingsData.sso_token_url;
            delete generalSettingsData.sso_user_info_url;
            delete generalSettingsData.sso_enabled;

            const updatedAdminSettings = await updateSettings(generalSettingsData);

            if (
                updatedAdminSettings.error ||
                [401, 403, 500].includes(updatedAdminSettings.statusCode)
            ) {
                setError(
                    updatedAdminSettings.error
                        ? updatedAdminSettings.error
                        : t('something_went_wrong')
                );
                return;
            }

            setFormData(prev => ({...prev, ...updatedAdminSettings})); // Update only non-SSO fields
            setSettings(prev => ({...prev, ...updatedAdminSettings}));
            setError(null);
            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
            }, 2500);
        } catch (err) {
            setError(err.toString());
        }
    };

    const onUpdateSsoSettings = async (e) => {
        e.preventDefault();
        setSsoError(null);
        setSsoSuccess(false);
        try {
            const updatedSsoData = await updateSsoSettings(ssoFormData);
            if (updatedSsoData.error || [401, 403, 500].includes(updatedSsoData.statusCode)) {
                setSsoError(updatedSsoData.error || t('something_went_wrong'));
                return;
            }
            setSsoFormData(updatedSsoData);
            setSsoSuccess(true);
            // Also update the main settings store if sso_enabled changed
            if (formData.sso_enabled !== updatedSsoData.sso_enabled) {
                 setSettings(prev => ({...prev, sso_enabled: updatedSsoData.sso_enabled}));
            }
            setTimeout(() => {
                setSsoSuccess(false);
            }, 2500);
        } catch (err) {
            setSsoError(err.toString());
        }
    };


    if (adminSettings.error || [401, 403, 500].includes(adminSettings.statusCode)) {
        const errorMsg = adminSettings.error ? adminSettings.error : t('not_logged_in');

        return (
            <div className="space-y-4">
                <ErrorBox message={errorMsg} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-10"> {/* Increased spacing between sections */}
            {/* General Settings Section */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">{t('settings.general_settings')}</h2>
                {error && <ErrorBox message={error} />}
                {success && <SuccessBox message={t('settings.updated')} />}
                <p className="text-sm text-gray-300 mb-4">{t('settings.description')}</p>
                <div className="space-y-4">
                    {/* Read Only Mode */}
                <div className="flex items-start space-x-3">
                    <input
                        type="checkbox"
                        id="read_only"
                        checked={formData.read_only}
                        onChange={(e) => setFormData({ ...formData, read_only: e.target.checked })}
                        className="mt-1 rounded border-gray-700 bg-gray-800 text-blue-500 
                                 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                    <div>
                        <label
                            htmlFor="read_only"
                            className="block text-sm font-medium text-gray-200"
                        >
                            {t('account.settings.read_only_mode')}
                        </label>
                        <p className="text-sm text-gray-400">
                            {t('account.settings.readonly_only_for_non_admin')}
                        </p>
                    </div>
                </div>

                {/* Disable Users */}
                <div className="flex items-start space-x-3">
                    <input
                        type="checkbox"
                        id="disable_users"
                        checked={formData.disable_users}
                        onChange={(e) =>
                            setFormData({ ...formData, disable_users: e.target.checked })
                        }
                        className="mt-1 rounded border-gray-700 bg-gray-800 text-blue-500 
                                 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                    <div>
                        <label
                            htmlFor="disable_users"
                            className="block text-sm font-medium text-gray-200"
                        >
                            {t('account.settings.disable_users')}
                        </label>
                        <p className="text-sm text-gray-400">
                            {t('account.settings.disable_signin')}
                        </p>
                    </div>
                </div>

                {/* Disable User Account Creation */}
                <div className="flex items-start space-x-3">
                    <input
                        type="checkbox"
                        id="disable_user_account_creation"
                        checked={formData.disable_user_account_creation}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                disable_user_account_creation: e.target.checked,
                            })
                        }
                        className="mt-1 rounded border-gray-700 bg-gray-800 text-blue-500 
                                 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                    <div>
                        <label
                            htmlFor="disable_user_account_creation"
                            className="block text-sm font-medium text-gray-200"
                        >
                            {t('account.settings.disable_user_account_creation')}
                        </label>
                        <p className="text-sm text-gray-400">
                            {t('account.settings.disable_user_account_creation_description')}
                        </p>
                    </div>
                </div>

                {/* Disable allowed IP restriction */}
                <div className="flex items-start space-x-3">
                    <input
                        type="checkbox"
                        id="hide_allowed_ip_input"
                        checked={formData.hide_allowed_ip_input}
                        onChange={(e) =>
                            setFormData({ ...formData, hide_allowed_ip_input: e.target.checked })
                        }
                        className="mt-1 rounded border-gray-700 bg-gray-800 text-blue-500
                                 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                    <div>
                        <label
                            htmlFor="hide_allowed_ip_input"
                            className="block text-sm font-medium text-gray-200"
                        >
                            {t('account.settings.hide_allowed_ip_input')}
                        </label>
                        <p className="text-sm text-gray-400">
                            {t('account.settings.hide_allowed_ip_input_description')}
                        </p>
                    </div>
                </div>

                {/* Disable File Upload */}
                <div className="flex items-start space-x-3">
                    <input
                        type="checkbox"
                        id="disable_file_upload"
                        checked={formData.disable_file_upload}
                        onChange={(e) =>
                            setFormData({ ...formData, disable_file_upload: e.target.checked })
                        }
                        className="mt-1 rounded border-gray-700 bg-gray-800 text-blue-500 
                                 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                    <div>
                        <label
                            htmlFor="disable_file_upload"
                            className="block text-sm font-medium text-gray-200"
                        >
                            {t('account.settings.disable_file_upload')}
                        </label>
                        <p className="text-sm text-gray-400">
                            {t('account.settings.disable_file_upload_description')}
                        </p>
                    </div>
                </div>

                {/* Restrict Organization Email */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-200">
                        {t('account.settings.restrict_organization_email')}
                    </label>
                    <p className="text-sm text-gray-400 mb-2">
                        {t('account.settings.restrict_organization_email_description')}
                    </p>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <IconAt size={14} />
                        </span>
                        <input
                            type="text"
                            placeholder="example.com"
                            value={formData.restrict_organization_email}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    restrict_organization_email: e.target.value,
                                })
                            }
                            className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 
                                     rounded-md text-gray-100 placeholder-gray-500
                                     focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                        />
                    </div>
                </div>
                {/* Update General Settings Button */}
                <div className="flex justify-end mt-6">
                    <button
                        onClick={onUpdateSettings}
                        disabled={success}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md
                                 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                                 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50
                                 disabled:cursor-not-allowed transition-colors"
                    >
                        <IconEdit size={14} />
                        {t('settings.update_general')}
                    </button>
                </div>
            </div>

            {/* SSO Settings Section */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">{t('settings.sso.title')}</h2>
                {ssoError && <ErrorBox message={ssoError} />}
                {ssoSuccess && <SuccessBox message={t('settings.sso.updated')} />}
                <p className="text-sm text-gray-300 mb-4">{t('settings.sso.description')}</p>
                <form onSubmit={onUpdateSsoSettings} className="space-y-4">
                    {/* SSO Enabled Toggle */}
                    <div className="flex items-start space-x-3">
                        <input
                            type="checkbox"
                            id="sso_enabled"
                            checked={ssoFormData.sso_enabled}
                            onChange={(e) =>
                                setSsoFormData({ ...ssoFormData, sso_enabled: e.target.checked })
                            }
                            className="mt-1 rounded border-gray-700 bg-gray-800 text-blue-500
                                     focus:ring-blue-500 focus:ring-offset-gray-900"
                        />
                        <div>
                            <label
                                htmlFor="sso_enabled"
                                className="block text-sm font-medium text-gray-200"
                            >
                                {t('settings.sso.enable')}
                            </label>
                            <p className="text-sm text-gray-400">
                                {t('settings.sso.enable_description')}
                            </p>
                        </div>
                    </div>

                    {/* SSO Client ID */}
                    <div>
                        <label htmlFor="sso_client_id" className="block text-sm font-medium text-gray-200">
                            {t('settings.sso.client_id')}
                        </label>
                        <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <IconKey size={14} />
                            </span>
                            <input
                                type="text"
                                name="sso_client_id"
                                id="sso_client_id"
                                value={ssoFormData.sso_client_id}
                                onChange={(e) => setSsoFormData({ ...ssoFormData, sso_client_id: e.target.value })}
                                placeholder="Enter Client ID"
                                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700
                                         rounded-md text-gray-100 placeholder-gray-500
                                         focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* SSO Client Secret */}
                    <div>
                        <label htmlFor="sso_client_secret" className="block text-sm font-medium text-gray-200">
                            {t('settings.sso.client_secret')}
                        </label>
                        <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <IconKey size={14} />
                            </span>
                            <input
                                type="password" // Use password type for secrets
                                name="sso_client_secret"
                                id="sso_client_secret"
                                value={ssoFormData.sso_client_secret}
                                onChange={(e) => setSsoFormData({ ...ssoFormData, sso_client_secret: e.target.value })}
                                placeholder="Enter Client Secret"
                                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700
                                         rounded-md text-gray-100 placeholder-gray-500
                                         focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* SSO Authorization URL */}
                    <div>
                        <label htmlFor="sso_authorization_url" className="block text-sm font-medium text-gray-200">
                            {t('settings.sso.authorization_url')}
                        </label>
                        <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <IconLink size={14} />
                            </span>
                            <input
                                type="url"
                                name="sso_authorization_url"
                                id="sso_authorization_url"
                                value={ssoFormData.sso_authorization_url}
                                onChange={(e) => setSsoFormData({ ...ssoFormData, sso_authorization_url: e.target.value })}
                                placeholder="https://provider.com/auth"
                                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700
                                         rounded-md text-gray-100 placeholder-gray-500
                                         focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* SSO Token URL */}
                    <div>
                        <label htmlFor="sso_token_url" className="block text-sm font-medium text-gray-200">
                            {t('settings.sso.token_url')}
                        </label>
                        <div className="relative mt-1">
                             <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <IconLink size={14} />
                            </span>
                            <input
                                type="url"
                                name="sso_token_url"
                                id="sso_token_url"
                                value={ssoFormData.sso_token_url}
                                onChange={(e) => setSsoFormData({ ...ssoFormData, sso_token_url: e.target.value })}
                                placeholder="https://provider.com/token"
                                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700
                                         rounded-md text-gray-100 placeholder-gray-500
                                         focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* SSO User Info URL */}
                    <div>
                        <label htmlFor="sso_user_info_url" className="block text-sm font-medium text-gray-200">
                            {t('settings.sso.user_info_url')}
                        </label>
                        <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <IconWorldWww size={14} />
                            </span>
                            <input
                                type="url"
                                name="sso_user_info_url"
                                id="sso_user_info_url"
                                value={ssoFormData.sso_user_info_url}
                                onChange={(e) => setSsoFormData({ ...ssoFormData, sso_user_info_url: e.target.value })}
                                placeholder="https://provider.com/userinfo"
                                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700
                                         rounded-md text-gray-100 placeholder-gray-500
                                         focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            />
                        </div>
                         <p className="text-sm text-gray-400 mt-1">
                            {t('settings.sso.user_info_url_description')}
                        </p>
                    </div>

                    {/* Update SSO Settings Button */}
                    <div className="flex justify-end mt-6">
                        <button
                            type="submit"
                            disabled={ssoSuccess}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md
                                     hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                                     focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50
                                     disabled:cursor-not-allowed transition-colors"
                        >
                            <IconEdit size={14} />
                            {t('settings.sso.update_sso')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
