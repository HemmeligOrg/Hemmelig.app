import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData, useNavigate, useRevalidator, useSearchParams } from 'react-router-dom';
import { AddUserModal } from '../../components/AddUserModal';
import { Button } from '../../components/Button';
import { EditUserModal } from '../../components/EditUserModal';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Notice } from '../../components/Notice';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { Table, TableEmpty, TableHead, TableRow } from '../../components/Table';
import {
    useUsersStore,
    type ManagedUser,
    type NewUser,
    type UserUpdate,
} from '../../store/usersStore';
import { useUserStore } from '../../store/userStore';

type PaginationMeta = {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

type LoaderData = {
    users: ManagedUser[];
    error: string | null;
    pagination: PaginationMeta;
    search: string;
};

const columns = 'grid-cols-[minmax(0,2fr)_90px_110px_minmax(190px,auto)]';

export function UsersPage() {
    const { t, i18n } = useTranslation();
    const loaderData = useLoaderData() as LoaderData;
    const navigate = useNavigate();
    const revalidator = useRevalidator();
    const [searchParams] = useSearchParams();
    const [searchInput, setSearchInput] = useState(loaderData.search || '');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const {
        userToDelete,
        userToEdit,
        isAddUserModalOpen,
        addUser,
        editUser,
        setBanned,
        deleteUser,
        setUserToDelete,
        setUserToEdit,
        setIsAddUserModalOpen,
    } = useUsersStore();
    const currentUserId = useUserStore((state) => state.user?.id);

    const users = loaderData.users || [];
    const pagination = loaderData.pagination || { total: 0, page: 1, pageSize: 10, totalPages: 0 };
    const error = loaderData.error;

    const [previousSearch, setPreviousSearch] = useState(loaderData.search);

    // Sync the search input with the URL when the loader data changes.
    if (loaderData.search !== previousSearch) {
        setPreviousSearch(loaderData.search);
        setSearchInput(loaderData.search || '');
    }

    const updateUrl = (params: { page?: number; search?: string }) => {
        const newParams = new URLSearchParams(searchParams);
        if (params.page !== undefined) {
            newParams.set('page', params.page.toString());
        }
        if (params.search !== undefined) {
            if (params.search) {
                newParams.set('search', params.search);
                newParams.set('page', '1'); // Reset to page 1 when searching
            } else {
                newParams.delete('search');
            }
        }
        navigate(`/dashboard/users?${newParams.toString()}`);
    };

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            updateUrl({ search: value });
        }, 300);
    };

    const handlePageChange = (page: number) => {
        updateUrl({ page });
    };

    const handleUserAdded = async (newUser: NewUser) => {
        await addUser(newUser);
        // Revalidate to refresh data from the server
        revalidator.revalidate();
    };

    const handleUserEdited = async (user: UserUpdate) => {
        await editUser(user);
        // Revalidate to refresh data from the server
        revalidator.revalidate();
    };

    const handleToggleBan = async (user: ManagedUser) => {
        await setBanned(user.id, !user.banned);
        revalidator.revalidate();
    };

    const handleUserDeleted = async () => {
        await deleteUser();
        // If we deleted the last user on the current page, go to previous page
        const isLastUserOnPage = users.length === 1 && pagination.page > 1;
        if (isLastUserOnPage) {
            handlePageChange(pagination.page - 1);
        } else {
            // Revalidate to refresh data from the server
            revalidator.revalidate();
        }
    };

    const header = (
        <PageHeader
            title={t('users_page.title')}
            description={t('users_page.description')}
            action={
                !error && (
                    <Button variant="primary" onClick={() => setIsAddUserModalOpen(true)}>
                        {t('users_page.add_user_button')}
                    </Button>
                )
            }
        />
    );

    if (error) {
        return (
            <div className="grid gap-5 content-start">
                {header}
                <Notice tone="danger">{error}</Notice>
            </div>
        );
    }

    return (
        <div className="grid gap-5 content-start">
            {header}

            <Input
                type="search"
                controlSize="lg"
                aria-label={t('users_page.search_placeholder')}
                placeholder={t('users_page.search_placeholder')}
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="max-w-105"
            />

            <Table minWidthClassName="min-w-[620px]">
                <TableHead className={columns}>
                    <span>{t('users_page.table.user_header')}</span>
                    <span>{t('users_page.table.role_header')}</span>
                    <span>{t('users_page.table.joined_header')}</span>
                    <span className="sr-only">{t('users_page.table.actions_header')}</span>
                </TableHead>
                {users.length === 0 ? (
                    <TableEmpty>
                        <div className="text-fg">{t('users_page.no_users_found_title')}</div>
                        <div className="text-ui">
                            {loaderData.search
                                ? t('users_page.no_users_found_description_filter')
                                : t('users_page.no_users_found_description_empty')}
                        </div>
                    </TableEmpty>
                ) : (
                    users.map((user) => {
                        const isSelf = user.id === currentUserId;
                        const isAdmin = user.role === 'admin';
                        return (
                            <TableRow key={user.id} className={columns} dim={user.banned}>
                                <div className="min-w-0">
                                    <div className="truncate">
                                        {user.username}{' '}
                                        {user.banned && (
                                            <span className="text-xs text-danger">
                                                {t('users_page.status.banned')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="font-mono text-xs text-faint truncate">
                                        {user.email}
                                    </div>
                                </div>
                                <span
                                    className={`justify-self-start font-mono text-xs px-2 py-0.5 rounded-[3px] border ${
                                        isAdmin
                                            ? 'border-accent text-accent'
                                            : 'border-line text-muted'
                                    }`}
                                >
                                    {isAdmin
                                        ? t('users_page.filter.admin')
                                        : t('users_page.filter.user')}
                                </span>
                                <span className="text-ui text-muted">
                                    {new Date(user.createdAt).toLocaleDateString(i18n.language, {
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </span>
                                <div className="flex gap-3.5 justify-end">
                                    <Button
                                        variant="ghost"
                                        size="inline"
                                        disabled={isSelf}
                                        onClick={() => setUserToEdit(user)}
                                    >
                                        {t('users_page.actions.edit')}
                                    </Button>
                                    <Button
                                        variant={user.banned ? 'link' : 'danger'}
                                        size="inline"
                                        disabled={isSelf}
                                        onClick={() => handleToggleBan(user)}
                                    >
                                        {user.banned
                                            ? t('users_page.actions.unban')
                                            : t('users_page.actions.ban')}
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="inline"
                                        disabled={isSelf}
                                        onClick={() => setUserToDelete(user)}
                                    >
                                        {t('common.delete')}
                                    </Button>
                                </div>
                            </TableRow>
                        );
                    })
                )}
            </Table>

            <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.pageSize}
                onPageChange={handlePageChange}
            />

            <Modal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleUserDeleted}
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
                onSave={handleUserEdited}
                user={userToEdit}
            />
            <AddUserModal
                isOpen={isAddUserModalOpen}
                onClose={() => setIsAddUserModalOpen(false)}
                onSave={handleUserAdded}
            />
        </div>
    );
}
