import { IconAt, IconEdit, IconEye, IconEyeOff, IconLock, IconTrash } from '@tabler/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLoaderData } from 'react-router-dom';

import { deleteUser, updateUser } from '../../api/account';
import ErrorBox from '../../components/error-box';
import SuccessBox from '../../components/success-box';

const Account = () => {
    const { t } = useTranslation();
    const userInfo = useLoaderData();

    // Form state
    const [formData, setFormData] = useState({
        email: userInfo?.user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });

    // UI state
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [deleted, setDeleted] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const onProfileUpdate = async (e) => {
        e.preventDefault();

        try {
            const updatedUserInfo = await updateUser(formData);

            if (updatedUserInfo.error || [400, 401, 500].includes(updatedUserInfo.statusCode)) {
                setError(updatedUserInfo.message || t('account.account.can_not_update_profile'));
                return;
            }

            setError(null);
            setSuccessMessage('settings.updated');
            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
                setSuccessMessage(null);
            }, 2500);
        } catch (err) {
            setError(err);
        }
    };

    const onDeleteUser = async () => {
        try {
            const deletedUserInfo = await deleteUser();

            if (deletedUserInfo.error || [401, 500].includes(deletedUserInfo.statusCode)) {
                setError(deletedUserInfo.error || t('account.account.can_not_delete'));
                return;
            }

            setError(null);
            setSuccessMessage('settings.deleted');
            setSuccess(true);

            setTimeout(() => {
                setDeleted(true);
            }, 1000);
        } catch (err) {
            setError(err);
        }
    };

    const openDeleteModal = () => {
        if (window.confirm(t('account.account.do_you_want_delete'))) {
            onDeleteUser();
        }
    };

    if (deleted) {
        return <Navigate to="/signout" />;
    }

    if (userInfo.error || [401, 500].includes(userInfo.statusCode)) {
        return (
            <div className="space-y-4">
                <ErrorBox message={userInfo.error || t('not_logged_in')} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            {/* Messages */}
            {error && <ErrorBox message={error} className="w-full" />}
            {success && <SuccessBox message={successMessage} className="w-full" />}

            {/* Form */}
            <form onSubmit={onProfileUpdate} className="space-y-6">
                <div className="bg-gray-800/50 p-6 rounded-lg space-y-4">
                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            {t('account.account.email')}
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <IconAt size={18} />
                            </span>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder={t('account.account.email')}
                                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 
                                         rounded-md text-gray-100 placeholder-gray-500 
                                         focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Current Password Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            {t('account.account.your_password')}
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <IconLock size={18} />
                            </span>
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleInputChange}
                                placeholder={t('account.account.current_password')}
                                className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 
                                         rounded-md text-gray-100 placeholder-gray-500 
                                         focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowPasswords((prev) => ({
                                        ...prev,
                                        current: !prev.current,
                                    }))
                                }
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 
                                         hover:text-gray-300"
                            >
                                {showPasswords.current ? (
                                    <IconEyeOff size={18} />
                                ) : (
                                    <IconEye size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* New Password Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            {t('account.account.new_password')}
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <IconLock size={18} />
                            </span>
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                placeholder={t('account.account.update_your_password')}
                                className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 
                                         rounded-md text-gray-100 placeholder-gray-500 
                                         focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowPasswords((prev) => ({
                                        ...prev,
                                        new: !prev.new,
                                    }))
                                }
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 
                                         hover:text-gray-300"
                            >
                                {showPasswords.new ? (
                                    <IconEyeOff size={18} />
                                ) : (
                                    <IconEye size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Confirm New Password Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            {t('account.account.confirm_password')}
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <IconLock size={18} />
                            </span>
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                name="confirmNewPassword"
                                value={formData.confirmNewPassword}
                                onChange={handleInputChange}
                                placeholder={t('account.account.confirm_new_password')}
                                className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 
                                         rounded-md text-gray-100 placeholder-gray-500 
                                         focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowPasswords((prev) => ({
                                        ...prev,
                                        confirm: !prev.confirm,
                                    }))
                                }
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 
                                         hover:text-gray-300"
                            >
                                {showPasswords.confirm ? (
                                    <IconEyeOff size={18} />
                                ) : (
                                    <IconEye size={18} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        type="button"
                        onClick={openDeleteModal}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 
                                 bg-red-500/20 text-red-500 rounded-md hover:bg-red-500/30 
                                 transition-colors"
                    >
                        <IconTrash size={18} />
                        {t('account.account.delete_account')}
                    </button>

                    <button
                        type="submit"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 
                                 bg-gray-600 text-white rounded-md hover:bg-gray-500 
                                 transition-colors"
                    >
                        <IconEdit size={18} />
                        {t('account.account.update_details')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Account;
