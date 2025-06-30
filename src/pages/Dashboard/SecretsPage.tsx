import React, { useState } from 'react';
import {
    Shield,
    Eye,
    Clock,
    Copy,
    Trash2,
    Plus,
    Search,
    Filter,
    ExternalLink,
    Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Secret {
    id: string;
    title: string;
    createdAt: Date;
    expiresAt?: Date;
    views: number;
    maxViews: number;
    isPasswordProtected: boolean;
    isExpired: boolean;
    url: string;
}

export function SecretsPage() {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');

    // Mock data - in real app this would come from API
    const [secrets] = useState<Secret[]>([
        {
            id: '1',
            title: 'API Keys for Production',
            createdAt: new Date('2024-01-15'),
            expiresAt: new Date('2024-02-15'),
            views: 3,
            maxViews: 5,
            isPasswordProtected: true,
            isExpired: false,
            url: 'https://hemmelig.app/s/abc123'
        },
        {
            id: '2',
            title: 'Database Credentials',
            createdAt: new Date('2024-01-10'),
            expiresAt: new Date('2024-01-20'),
            views: 1,
            maxViews: 1,
            isPasswordProtected: false,
            isExpired: true,
            url: 'https://hemmelig.app/s/def456'
        },
        {
            id: '3',
            title: 'Meeting Notes',
            createdAt: new Date('2024-01-20'),
            views: 0,
            maxViews: 10,
            isPasswordProtected: false,
            isExpired: false,
            url: 'https://hemmelig.app/s/ghi789'
        }
    ]);

    const filteredSecrets = secrets.filter(secret => {
        const matchesSearch = secret.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' ||
            (filterStatus === 'active' && !secret.isExpired) ||
            (filterStatus === 'expired' && secret.isExpired);
        return matchesSearch && matchesFilter;
    });

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        // In real app, show toast notification
    };

    const deleteSecret = (id: string) => {
        // In real app, show confirmation dialog and delete
        console.log('Delete secret:', id);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getTimeRemaining = (expiresAt?: Date) => {
        if (!expiresAt) return 'Never expires';

        const now = new Date();
        const diff = expiresAt.getTime() - now.getTime();

        if (diff <= 0) return 'Expired';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h`;
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('secrets_page.title')}</h1>
                        <p className="text-slate-400 mt-1">{t('secrets_page.description')}</p>
                    </div>
                    <Link
                        to="/"
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg transition-all duration-300 hover:scale-105 w-fit"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t('secrets_page.create_secret_button')}</span>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder={t('secrets_page.search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                    >
                        <option value="all">{t('secrets_page.filter.all_secrets')}</option>
                        <option value="active">{t('secrets_page.filter.active')}</option>
                        <option value="expired">{t('secrets_page.filter.expired')}</option>
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-teal-500/20 rounded-lg">
                            <Shield className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{secrets.length}</p>
                            <p className="text-sm text-slate-400">{t('secrets_page.total_secrets')}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <Eye className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{secrets.filter(s => !s.isExpired).length}</p>
                            <p className="text-sm text-slate-400">{t('secrets_page.active_secrets')}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <Clock className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{secrets.filter(s => s.isExpired).length}</p>
                            <p className="text-sm text-slate-400">{t('secrets_page.expired_secrets')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secrets List */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                {filteredSecrets.length === 0 ? (
                    <div className="p-8 text-center">
                        <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">{t('secrets_page.no_secrets_found_title')}</h3>
                        <p className="text-slate-400 mb-4">
                            {searchTerm || filterStatus !== 'all'
                                ? t('secrets_page.no_secrets_found_description_filter')
                                : t('secrets_page.no_secrets_found_description_empty')
                            }
                        </p>
                        {!searchTerm && filterStatus === 'all' && (
                            <Link
                                to="/"
                                className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all duration-300"
                            >
                                <Plus className="w-4 h-4" />
                                <span>{t('secrets_page.create_secret_button')}</span>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/30 border-b border-slate-600/50">
                                <tr>
                                    <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-slate-300">{t('secrets_page.table.secret_header')}</th>
                                    <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-slate-300 hidden sm:table-cell">{t('secrets_page.table.created_header')}</th>
                                    <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-slate-300">{t('secrets_page.table.status_header')}</th>
                                    <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-slate-300 hidden lg:table-cell">{t('secrets_page.table.views_header')}</th>
                                    <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-slate-300">{t('secrets_page.table.actions_header')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-600/30">
                                {filteredSecrets.map((secret) => (
                                    <tr key={secret.id} className="hover:bg-slate-700/20 transition-colors duration-200">
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="flex items-start space-x-3">
                                                <div className={`p-2 rounded-lg flex-shrink-0 ${secret.isExpired ? 'bg-red-500/20' : 'bg-teal-500/20'
                                                    }`}>
                                                    <Shield className={`w-4 h-4 ${secret.isExpired ? 'text-red-400' : 'text-teal-400'
                                                        }`} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-white truncate">
                                                        {secret.title || t('secrets_page.table.untitled_secret')}
                                                    </p>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        {secret.isPasswordProtected && (
                                                            <Lock className="w-3 h-3 text-slate-400" />
                                                        )}
                                                        <p className="text-xs text-slate-400 truncate">
                                                            {secret.url}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-sm text-slate-400 hidden sm:table-cell">
                                            {formatDate(secret.createdAt)}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="space-y-1">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${secret.isExpired
                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    }`}>
                                                    {secret.isExpired ? t('secrets_page.table.expired_status') : t('secrets_page.table.active_status')}
                                                </span>
                                                <p className="text-xs text-slate-400">
                                                    {getTimeRemaining(secret.expiresAt) === 'Never expires' ? t('secrets_page.table.never_expires') : getTimeRemaining(secret.expiresAt) === 'Expired' ? t('secrets_page.table.expired_time') : getTimeRemaining(secret.expiresAt)}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-sm text-slate-400 hidden lg:table-cell">
                                            <div className="flex items-center space-x-2">
                                                <Eye className="w-4 h-4" />
                                                <span>{secret.views}/{secret.maxViews}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => copyToClipboard(secret.url)}
                                                    className="p-2 text-slate-400 hover:text-teal-400 transition-colors duration-200"
                                                    title={t('secrets_page.table.copy_url_tooltip')}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <a
                                                    href={secret.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-slate-400 hover:text-blue-400 transition-colors duration-200"
                                                    title={t('secrets_page.table.open_secret_tooltip')}
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                                <button
                                                    onClick={() => deleteSecret(secret.id)}
                                                    className="p-2 text-slate-400 hover:text-red-400 transition-colors duration-200"
                                                    title={t('secrets_page.table.delete_secret_tooltip')}
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
