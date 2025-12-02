import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Shield, Ban } from 'lucide-react';
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
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('users_page.edit_user_modal.username_label')}
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-dark-700/50 border border-dark-500/50  text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('users_page.edit_user_modal.email_label')}
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-dark-700/50 border border-dark-500/50  text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('users_page.edit_user_modal.role_label')}
                    </label>
                    <div className="relative">
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-dark-700/50 border border-dark-500/50  text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300 appearance-none"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={banned}
                            onChange={(e) => setBanned(e.target.checked)}
                            className="h-4 w-4 border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="ml-2 text-sm text-slate-300">
                            <Ban className="inline w-4 h-4 mr-2" />
                            {t('users_page.edit_user_modal.banned_label')}
                        </span>
                    </label>
                </div>
            </div>
        </Modal>
    );
}
