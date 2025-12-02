import { Check, Edit, Search, Trash2, UserPlus, X } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AddUserModal } from '../../components/AddUserModal';
import { EditUserModal } from '../../components/EditUserModal';
import { Modal } from '../../components/Modal';
import { useAccountStore } from '../../store/accountStore';
import { useUsersStore } from '../../store/usersStore';

export function UsersPage() {
  const { t } = useTranslation();
  const {
    users,
    userToDelete,
    userToEdit,
    isAddUserModalOpen,
    searchTerm,
    error,
    fetchUsers,
    addUser,
    editUser,
    deleteUser,
    approveUser,
    rejectUser,
    setUserToDelete,
    setUserToEdit,
    setIsAddUserModalOpen,
    setSearchTerm,
  } = useUsersStore();
  const { profileData } = useAccountStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (error) {
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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('users_page.title')}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{t('users_page.description')}</p>
        </div>
        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white transition-all duration-300 w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('users_page.add_user_button')}</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('users_page.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
            <thead className="bg-gray-50 dark:bg-dark-800">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6"
                >
                  {t('users_page.table.user_header')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {t('users_page.table.role_header')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {t('users_page.table.status_header')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white hidden sm:table-cell"
                >
                  {t('users_page.table.created_at')}
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">
                    {t('users_page.table.actions_header')}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </div>
                        <div className="text-gray-500 dark:text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-slate-400">
                    {user.role}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-slate-400">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold ${
                        user.banned 
                          ? 'bg-red-500/20 text-red-400' 
                          : user.approved === false 
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {user.banned
                        ? t('users_page.status.banned')
                        : user.approved === false
                          ? 'Pending'
                          : t('users_page.status.active')}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-slate-400 hidden sm:table-cell">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    {user.approved === false ? (
                      <>
                        <button
                          onClick={() => approveUser(user.id)}
                          className="text-green-400 hover:text-green-300 mr-2"
                          title="Approve user"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => rejectUser(user.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Reject user"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setUserToEdit(user)}
                          disabled={user.id === profileData.id}
                          className="text-blue-400 hover:text-blue-300 disabled:opacity-50 mr-2"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setUserToDelete(user)}
                          disabled={user.id === profileData.id}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
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
