import { Key, Mail, Shield, User } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { ModalInput } from './ModalInput';

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
                <ModalInput
                    label={t('users_page.add_user_modal.name_label')}
                    icon={User}
                    type="text"
                    value={name}
                    onChange={setName}
                />
                <ModalInput
                    label={t('users_page.add_user_modal.username_label')}
                    icon={User}
                    type="text"
                    value={username}
                    onChange={setUsername}
                />
                <ModalInput
                    label={t('users_page.add_user_modal.email_label')}
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={setEmail}
                />
                <ModalInput
                    label={t('users_page.add_user_modal.password_label')}
                    icon={Key}
                    type="password"
                    value={password}
                    onChange={setPassword}
                />
                <ModalInput
                    label={t('users_page.add_user_modal.role_label')}
                    icon={Shield}
                    as="select"
                    value={role}
                    onChange={setRole}
                    options={[
                        { value: 'user', label: 'User' },
                        { value: 'admin', label: 'Admin' },
                    ]}
                />
            </div>
        </Modal>
    );
}
