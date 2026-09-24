import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type UserUpdate } from '../store/usersStore';
import { Modal } from './Modal';
import { ModalInput } from './ModalInput';
import { ToggleSwitch } from './ToggleSwitch';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: UserUpdate) => void;
    user: UserUpdate | null;
}

export function EditUserModal({ isOpen, onClose, onSave, user }: EditUserModalProps) {
    const { t } = useTranslation();
    const [username, setUsername] = useState(user?.username);
    const [email, setEmail] = useState(user?.email);
    const [role, setRole] = useState(user?.role);
    const [banned, setBanned] = useState(user?.banned);

    const [previousUser, setPreviousUser] = useState(user);

    // Load the fields again when the dialog opens for another user.
    if (user !== previousUser) {
        setPreviousUser(user);
        if (user) {
            setUsername(user.username);
            setEmail(user.email);
            setRole(user.role);
            setBanned(user.banned);
        }
    }

    const handleSave = () => {
        if (user) {
            onSave({
                id: user.id,
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
            confirmVariant="primary"
        >
            <div className="grid gap-3">
                <ModalInput
                    label={t('users_page.edit_user_modal.username_label')}
                    type="text"
                    autoComplete="off"
                    value={username}
                    onChange={setUsername}
                />
                <ModalInput
                    label={t('users_page.edit_user_modal.email_label')}
                    type="email"
                    autoComplete="off"
                    value={email}
                    onChange={setEmail}
                />
                <ModalInput
                    label={t('users_page.edit_user_modal.role_label')}
                    as="select"
                    value={role}
                    onChange={setRole}
                    options={[
                        { value: 'user', label: t('users_page.filter.user') },
                        { value: 'admin', label: t('users_page.filter.admin') },
                    ]}
                />
                <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-ui text-fg">
                        {t('users_page.edit_user_modal.banned_label')}
                    </span>
                    <ToggleSwitch
                        checked={banned ?? false}
                        onChange={setBanned}
                        label={t('users_page.edit_user_modal.banned_label')}
                    />
                </div>
            </div>
        </Modal>
    );
}
