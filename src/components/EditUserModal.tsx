import { Ban, Mail, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { ModalInput } from './ModalInput';

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
    const [username, setUsername] = useState(user?.username);
    const [email, setEmail] = useState(user?.email);
    const [role, setRole] = useState(user?.role);
    const [banned, setBanned] = useState(user?.banned);

    useEffect(() => {
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
                <ModalInput
                    label={t('users_page.edit_user_modal.username_label')}
                    icon={User}
                    type="text"
                    value={username}
                    onChange={setUsername}
                />
                <ModalInput
                    label={t('users_page.edit_user_modal.email_label')}
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={setEmail}
                />
                <ModalInput
                    label={t('users_page.edit_user_modal.role_label')}
                    icon={Shield}
                    as="select"
                    value={role}
                    onChange={setRole}
                    options={[
                        { value: 'user', label: 'User' },
                        { value: 'admin', label: 'Admin' },
                    ]}
                />
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
