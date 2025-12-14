import { Key, Mail, Shield, User } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';

interface NewUser {
    name: string;
    username: string;
    email: string;
    password: string;
    role: string;
}

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newUser: NewUser) => void;
}

export function AddUserModal({ isOpen, onClose, onSave }: AddUserModalProps) {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');

    const handleSave = () => {
        onSave({
            name,
            username,
            email,
            password,
            role,
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={handleSave}
            title={t('users_page.add_user_modal.title')}
            confirmText={t('users_page.add_user_modal.save_button')}
            cancelText={t('users_page.add_user_modal.cancel_button')}
        >
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                        {t('users_page.add_user_modal.name_label')}
                    </label>
                    <div className="relative">
                        <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                        {t('users_page.add_user_modal.username_label')}
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
                        {t('users_page.add_user_modal.email_label')}
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
                        {t('users_page.add_user_modal.password_label')}
                    </label>
                    <div className="relative">
                        <Key className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                        {t('users_page.add_user_modal.role_label')}
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
            </div>
        </Modal>
    );
}
