import React, { useState } from 'react';
import {
    Users,
    Search,
    Filter,
    UserPlus,
    Shield,
    Ban,
    Edit,
    Trash2,
    Calendar,
    Eye
} from 'lucide-react';

interface User {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'user';
    status: 'active' | 'suspended' | 'pending';
    createdAt: Date;
    lastLogin?: Date;
    secretsCount: number;
    totalViews: number;
}

export function UsersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Mock data - in real app this would come from API
    const [users] = useState<User[]>([
        {
            id: '1',
            username: 'johndoe',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'admin',
            status: 'active',
            createdAt: new Date('2024-01-01'),
            lastLogin: new Date('2024-01-20'),
            secretsCount: 45,
            totalViews: 234
        },
        {
            id: '2',
            username: 'janedoe',
            email: 'jane@example.com',
            firstName: 'Jane',
            lastName: 'Doe',
            role: 'user',
            status: 'active',
            createdAt: new Date('2024-01-05'),
            lastLogin: new Date('2024-01-19'),
            secretsCount: 23,
            totalViews: 156
        },
        {
            id: '3',
            username: 'bobsmith',
            email: 'bob@example.com',
            firstName: 'Bob',
            lastName: 'Smith',
            role: 'user',
            status: 'suspended',
            createdAt: new Date('2024-01-10'),
            lastLogin: new Date('2024-01-15'),
            secretsCount: 12,
            totalViews: 89
        },
        {
            id: '4',
            username: 'alicejohnson',
            email: 'alice@example.com',
            firstName: 'Alice',
            lastName: 'Johnson',
            role: 'user',
            status: 'pending',
            createdAt: new Date('2024-01-18'),
            secretsCount: 0,
            totalViews: 0
        }
    ]);

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    const handleUserAction = (action: string, user: User) => {
        console.log(`${action} user:`, user);
        // In real app, implement actual actions
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status: User['status']) => {
        switch (status) {
            case 'active':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'suspended':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default:
                return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    const getRoleColor = (role: User['role']) => {
        return role === 'admin'
            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">User Management</h1>
                        <p className="text-slate-400 mt-1">Manage users and their permissions</p>
                    </div>
                    <button
                        onClick={() => setShowUserModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg transition-all duration-300 hover:scale-105 w-fit"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Add User</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                    />
                </div>

                {/* Role Filter */}
                <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as any)}
                        className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                    </select>
                </div>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                </select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{users.length}</p>
                            <p className="text-sm text-slate-400">Total Users</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <Shield className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{users.filter(u => u.status === 'active').length}</p>
                            <p className="text-sm text-slate-400">Active</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Shield className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</p>
                            <p className="text-sm text-slate-400">Admins</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{users.filter(u => u.status === 'pending').length}</p>
                            <p className="text-sm text-slate-400">Pending</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                {filteredUsers.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
                        <p className="text-slate-400">
                            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                                ? 'Try adjusting your search or filter criteria.'
                                : 'No users have been added yet.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/30 border-b border-slate-600/50">
                                <tr>
                                    <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-slate-300">User</th>
                                    <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-slate-300 hidden sm:table-cell">Role</th>
                                    <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-slate-300">Status</th>
                                    <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-slate-300 hidden lg:table-cell">Activity</th>
                                    <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-slate-300 hidden lg:table-cell">Last Login</th>
                                    <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-slate-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-600/30">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-700/20 transition-colors duration-200">
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white font-medium text-sm">
                                                        {user.firstName[0]}{user.lastName[0]}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-white">
                                                        {user.firstName} {user.lastName}
                                                    </p>
                                                    <p className="text-sm text-slate-400">@{user.username}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-sm text-slate-400 hidden lg:table-cell">
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <Shield className="w-3 h-3" />
                                                    <span>{user.secretsCount} secrets</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Eye className="w-3 h-3" />
                                                    <span>{user.totalViews} views</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-sm text-slate-400 hidden lg:table-cell">
                                            {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleUserAction('edit', user)}
                                                    className="p-2 text-slate-400 hover:text-blue-400 transition-colors duration-200"
                                                    title="Edit User"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleUserAction('suspend', user)}
                                                    className="p-2 text-slate-400 hover:text-yellow-400 transition-colors duration-200"
                                                    title="Suspend User"
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleUserAction('delete', user)}
                                                    className="p-2 text-slate-400 hover:text-red-400 transition-colors duration-200"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
