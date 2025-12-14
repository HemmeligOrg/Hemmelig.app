import { Edit, Search, Trash2, UserPlus } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
import { AddUserModal } from '../../components/AddUserModal';
import { EditUserModal } from '../../components/EditUserModal';
import { Modal } from '../../components/Modal';
import { useAccountStore } from '../../store/accountStore';
import { useUsersStore } from '../../store/usersStore';

type User = {
    id: string;
    name: string;
    username: string;
    displayUsername: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    role: string;
    banned: boolean;
    banReason: string | null;
    banExpires: string | null;
    createdAt: string;
    updatedAt: string;
};

type LoaderData = {
    users: User[];
    error: string | null;
};

export function UsersPage() {
    const { t } = useTranslation();
    const loaderData = useLoaderData() as LoaderData;
    const {
        users,
        userToDelete,
        userToEdit,
        isAddUserModalOpen,
        searchTerm,
        error,
        setUsers,
        addUser,
        editUser,
        deleteUser,
        setUserToDelete,
        setUserToEdit,
        setIsAddUserModalOpen,
        setSearchTerm,
        setError,
    } = useUsersStore();
    const { profileData } = useAccountStore();

    // Initialize store with loader data
    useEffect(() => {
        if (loaderData.users) {
            setUsers(loaderData.users);
        }
        if (loaderData.error) {
            setError(loaderData.error);
        }
    }, [loaderData, setUsers, setError]);

    if (error || loaderData.error) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-red-500">Error</h2>
                <p className="text-gray-500 dark:text-slate-400 mt-2">{error}</p>
            </div>
        );
    }

    const filteredUsers = users.filter(
        (user) =>
            (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-4 sm:p-6">
            <div className="mb-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                        {t('users_page.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">
                        {t('users_page.description')}
                    </p>
                </div>
                <button
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium transition-colors w-fit"
                >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{t('users_page.add_user_button')}</span>
                </button>
            </div>

            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder={t('users_page.search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-xs pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                        <thead className="bg-gray-50 dark:bg-dark-700/50">
                            <tr>
                                <th
                                    scope="col"
                                    className="py-2.5 pl-4 pr-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 sm:pl-4"
                                >
                                    {t('users_page.table.user_header')}
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 dark:text-slate-400"
                                >
                                    {t('users_page.table.role_header')}
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 dark:text-slate-400"
                                >
                                    {t('users_page.table.status_header')}
                                </th>
                                <th
                                    scope="col"
                                    className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 dark:text-slate-400 hidden sm:table-cell"
                                >
                                    {t('users_page.table.created_at')}
                                </th>
                                <th scope="col" className="relative py-2.5 pl-3 pr-4 sm:pr-4">
                                    <span className="sr-only">
                                        {t('users_page.table.actions_header')}
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-600">
                            {filteredUsers.map((user) => (
                                <tr
                                    key={user.id}
                                    className="hover:bg-gray-50 dark:hover:bg-dark-700/30"
                                >
                                    <td className="whitespace-nowrap py-2.5 pl-4 pr-3 text-xs sm:pl-4">
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {user.username}
                                            </div>
                                            <div className="text-gray-500 dark:text-slate-400">
                                                {user.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-gray-500 dark:text-slate-400">
                                        {user.role}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2.5 text-xs">
                                        <span
                                            className={`px-1.5 py-0.5 inline-flex text-xs font-medium ${user.banned ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}
                                        >
                                            {user.banned
                                                ? t('users_page.status.banned')
                                                : t('users_page.status.active')}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-gray-500 dark:text-slate-400 hidden sm:table-cell">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="relative whitespace-nowrap py-2.5 pl-3 pr-4 text-right sm:pr-4">
                                        <button
                                            onClick={() => setUserToEdit(user)}
                                            disabled={user.id === profileData.id}
                                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-50 transition-colors mr-1"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setUserToDelete(user)}
                                            disabled={user.id === profileData.id}
                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={deleteUser}
                title={t('users_page.delete_user_modal.title')}
                confirmText={t('users_page.delete_user_modal.confirm_button')}
                cancelText={t('users_page.delete_user_modal.cancel_button')}
            >
                <p>
                    {t('users_page.delete_user_modal.confirmation_message', {
                        username: userToDelete?.username,
                    })}
                </p>
            </Modal>
            <EditUserModal
                isOpen={!!userToEdit}
                onClose={() => setUserToEdit(null)}
                onSave={editUser}
                user={userToEdit}
            />
            <AddUserModal
                isOpen={isAddUserModalOpen}
                onClose={() => setIsAddUserModalOpen(false)}
                onSave={addUser}
            />
        </div>
    );
}
