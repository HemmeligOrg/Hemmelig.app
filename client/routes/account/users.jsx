import { IconAt, IconChefHat, IconEdit, IconPlus, IconTrash, IconUser } from '@tabler/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';

import { addUser, deleteUser, getUsers, updateUser } from '../../api/users';
import ErrorBox from '../../components/error-box';
import SuccessBox from '../../components/success-box';

const SKIP = 10;

// Helper functions remain unchanged
const updateUserList = (users, form, action = 'update') => {
    return users.reduce((acc, current) => {
        if (action === 'update' && current.username === form.values.username) {
            acc.push(form.values);
        } else if (action === 'delete' && current.username === form.values.username) {
            // Skip
        } else {
            acc.push(current);
        }
        return acc;
    }, []);
};

const addUserList = (users, data) => {
    const updated = [...users];
    const [user] = data;
    updated.push(user);
    return updated;
};

// UserRows component with Tailwind styles
const UserRows = ({ users, open, form, setModalState, openDeleteModal }) => {
    return users.map((user) => (
        <tr key={user.username} className="hover:bg-gray-800/50">
            <td className="px-6 py-4 whitespace-nowrap text-gray-200">{user.username}</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-200">{user.email}</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-200">{user.role}</td>
            <td className="px-6 py-4 whitespace-nowrap">
                <button
                    onClick={(event) => {
                        open(event);
                        form.setValues(user);
                        setModalState('update');
                    }}
                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 
                             rounded-md transition-colors"
                >
                    <IconEdit size="1rem" />
                </button>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <button
                    onClick={() => openDeleteModal(user)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 
                             rounded-md transition-colors"
                >
                    <IconTrash size="1rem" />
                </button>
            </td>
        </tr>
    ));
};

const Users = () => {
    // State management remains unchanged
    const [modalState, setModalState] = useState('add');
    const [users, setUsers] = useState(useLoaderData());
    const [skip, setSkip] = useState(SKIP);
    const [showMore, setShowMore] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { t } = useTranslation();

    // Form handling remains unchanged
    const defaultValues = {
        username: '',
        email: '',
        role: 'user',
        password: '',
    };

    const [formValues, setFormValues] = useState(defaultValues);

    // Event handlers remain unchanged
    const onUpdateUser = async (event) => {
        event.preventDefault();

        try {
            const updatedUserInfo = await updateUser(formValues);

            if (
                updatedUserInfo.error ||
                [401, 403, 409, 500].includes(updatedUserInfo.statusCode)
            ) {
                setError(updatedUserInfo.error ? updatedUserInfo.error : t('something_went_wrong'));

                return;
            }

            setError(null);
            setSuccess(true);

            setUsers(updateUserList(users, { values: formValues }, 'update'));

            setTimeout(() => {
                setSuccess(false);
            }, 2500);
        } catch (err) {
            setError(err);
        }
    };

    const onAddUser = async (event) => {
        event.preventDefault();

        try {
            const addedUserInfo = await addUser(formValues);

            if (addedUserInfo.error || [401, 403, 409, 500].includes(addedUserInfo.statusCode)) {
                setError(addedUserInfo.error ? addedUserInfo.error : t('something_went_wrong'));

                return;
            }

            setError(null);
            setSuccess(true);

            setUsers(addUserList(users, addedUserInfo));

            setTimeout(() => {
                setSuccess(false);
            }, 2500);
        } catch (err) {
            setError(err);
        }
    };

    const onDeleteUser = async (user) => {
        try {
            const deletedUserInfo = await deleteUser(user);

            if (
                deletedUserInfo.error ||
                [401, 403, 409, 500].includes(deletedUserInfo.statusCode)
            ) {
                setError(deletedUserInfo.error ? deletedUserInfo.error : t('something_went_wrong'));

                return;
            }

            setError(null);
            setSuccess(true);

            setUsers(updateUserList(users, { values: user }, 'delete'));

            setTimeout(() => {
                setSuccess(false);
            }, 2500);
        } catch (err) {
            setError(err);
        }
    };

    const onLoadUsers = async (event) => {
        event.preventDefault();

        try {
            const moreUsers = await getUsers(skip);

            if (moreUsers.error || [401, 403, 409, 500].includes(moreUsers.statusCode)) {
                setError(moreUsers.error ? moreUsers.error : t('something_went_wrong'));

                return;
            }

            setError(null);

            if (moreUsers?.length < SKIP) {
                setShowMore(false);
            }

            setSkip(skip + SKIP);

            setUsers([...users, ...moreUsers]);
        } catch (err) {
            setError(err);
        }
    };

    const openDeleteModal = (user) => {
        if (window.confirm(t('account.users.do_you_want_delete'))) {
            onDeleteUser(user);
        }
    };

    // Error handling remains unchanged
    if (users.error || [401, 403, 500].includes(users?.statusCode)) {
        return (
            <div className="space-y-4">
                <ErrorBox message={users.error ? users.error : t('not_logged_in')} />
            </div>
        );
    }

    if (!users.length) {
        return (
            <div className="max-w-md mx-auto">
                <ErrorBox message={t('account.users.have_to_be_admin')} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium text-white">{t('users.edit')}</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-300"
                            >
                                ×
                            </button>
                        </div>

                        {error && <ErrorBox message={error} />}
                        {success && <SuccessBox message={'users.saved'} />}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    {t('account.users.username')}
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                        <IconUser size={14} />
                                    </span>
                                    <input
                                        type="text"
                                        value={formValues.username}
                                        onChange={(e) =>
                                            setFormValues({
                                                ...formValues,
                                                username: e.target.value,
                                            })
                                        }
                                        disabled={modalState === 'update'}
                                        placeholder={t('account.users.username')}
                                        className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 
                                                 rounded-md text-gray-100 placeholder-gray-500
                                                 focus:ring-2 focus:ring-gray-600 focus:border-transparent
                                                 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    {t('account.users.email')}
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                        <IconAt size={14} />
                                    </span>
                                    <input
                                        type="email"
                                        value={formValues.email}
                                        onChange={(e) =>
                                            setFormValues({ ...formValues, email: e.target.value })
                                        }
                                        placeholder={t('account.users.email')}
                                        className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 
                                                 rounded-md text-gray-100 placeholder-gray-500
                                                 focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Password Input (only for add) */}
                            {modalState === 'add' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        {t('account.users.password')}
                                    </label>
                                    <input
                                        type="password"
                                        value={formValues.password}
                                        onChange={(e) =>
                                            setFormValues({
                                                ...formValues,
                                                password: e.target.value,
                                            })
                                        }
                                        placeholder={t('account.users.password')}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 
                                                 rounded-md text-gray-100 placeholder-gray-500
                                                 focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                                    />
                                </div>
                            )}

                            {/* Role Select */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    {t('account.users.role')}
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                        <IconChefHat size={14} />
                                    </span>
                                    <select
                                        value={formValues.role}
                                        onChange={(e) =>
                                            setFormValues({ ...formValues, role: e.target.value })
                                        }
                                        className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 
                                                 rounded-md text-gray-100
                                                 focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                                    >
                                        <option value="admin">{t('account.users.admin')}</option>
                                        <option value="creator">
                                            {t('account.users.creator')}
                                        </option>
                                        <option value="user">{t('account.users.user')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={modalState === 'add' ? onAddUser : onUpdateUser}
                                disabled={success}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white 
                                         rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 
                                         focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 
                                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <IconEdit size={14} />
                                {t('users.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {error && <ErrorBox message={error} />}
            {success && !isModalOpen && <SuccessBox message={'users.deleted'} />}

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                {t('account.users.username')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                {t('account.users.email')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                {t('account.users.role')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                {t('users.edit')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                {t('account.users.delete')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        <UserRows
                            users={users}
                            open={() => setIsModalOpen(true)}
                            form={{ setValues: setFormValues }}
                            setModalState={setModalState}
                            openDeleteModal={openDeleteModal}
                        />
                    </tbody>
                </table>
            </div>

            {showMore && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={onLoadUsers}
                        className="px-4 py-2 bg-orange-600 text-white rounded-md 
                                 hover:bg-orange-700 focus:outline-none focus:ring-2 
                                 focus:ring-orange-500 focus:ring-offset-2 
                                 focus:ring-offset-gray-900 transition-colors"
                    >
                        {t('users.more')}
                    </button>
                </div>
            )}

            <div className="flex justify-end">
                <button
                    onClick={() => {
                        setFormValues(defaultValues);
                        setModalState('add');
                        setSuccess(false);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white 
                             rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 
                             focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 
                             transition-colors"
                >
                    <IconPlus size={14} />
                    {t('users.add')}
                </button>
            </div>
        </div>
    );
};

export default Users;
