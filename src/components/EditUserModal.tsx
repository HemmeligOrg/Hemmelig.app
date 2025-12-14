import { Ban, Mail, Shield, User } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';

interface UserData {
    id: string;
    username: string;
    email: string;
    role: string;
    banned: boolean;
}

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: UserData) => void;
    user: UserData | null;
}

export function EditUserModal({ isOpen, onClose, onSave, user }: EditUserModalProps) {
    const { t } = useTranslation();
    const [username, setUsername] = React.useState(user?.username);
    const [email, setEmail] = React.useState(user?.email);
    const [role, setRole] = React.useState(user?.role);
    const [banned, setBanned] = React.useState(user?.banned);

    React.useEffect(() => {
        if (user) {
            setUsername(user.username);
            setEmail(user.email);
            setRole(user.role);
            setBanned(user.banned);
        }
    }, [user]);

    const handleSave = () => {
        if (user) {
            onSave({
                ...user,
                username: username ?? '',
                email: email ?? '',
                role: role ?? 'user',
                banned: banned ?? false,
            });
        }
    };

    if (!user) {
        return null;
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={handleSave}
            title={t('users_page.edit_user_modal.title', { username: user.username })}
            confirmText={t('users_page.edit_user_modal.save_button')}
            cancelText={t('users_page.edit_user_modal.cancel_button')}
        >
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                        {t('users_page.edit_user_modal.username_label')}
                    </label>
                    <div className="relative">
                        <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                        {t('users_page.edit_user_modal.email_label')}
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                        {t('users_page.edit_user_modal.role_label')}
                    </label>
                    <div className="relative">
                        <Shield className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors appearance-none"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={banned}
                            onChange={(e) => setBanned(e.target.checked)}
                            className="h-3.5 w-3.5 border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-xs text-gray-600 dark:text-slate-300 flex items-center gap-1.5">
                            <Ban className="w-3.5 h-3.5" />
                            {t('users_page.edit_user_modal.banned_label')}
                        </span>
                    </label>
                </div>
            </div>
        </Modal>
    );
}
