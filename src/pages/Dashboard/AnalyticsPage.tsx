import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BarChart3,
    TrendingUp,
    Eye,
    Shield,
    Clock,
    Users,
    Calendar
} from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

export function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
    const { t } = useTranslation();
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await api.analytics.$get({ query: { timeRange } });
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setAnalytics(data);
            } catch (error) {
                toast.error('Failed to fetch analytics data.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [timeRange]);

    const timeRangeOptions = [
        { value: '7d', label: t('analytics_page.time_range.last_7_days') },
        { value: '30d', label: t('analytics_page.time_range.last_30_days') },
        { value: '90d', label: t('analytics_page.time_range.last_90_days') },
        { value: '1y', label: t('analytics_page.time_range.last_year') }
    ];

    if (loading) {
        return <div className="p-8 text-center">Loading analytics...</div>;
    }

    if (!analytics) {
        return <div className="p-8 text-center">Could not load analytics.</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('analytics_page.title')}</h1>
                        <p className="text-slate-400 mt-1">{t('analytics_page.description')}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
                            className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
                        >
                            {timeRangeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-teal-500/20 rounded-lg">
                            <Shield className="w-6 h-6 text-teal-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{analytics.totalSecrets}</p>
                            <p className="text-sm text-slate-400">{t('analytics_page.total_secrets')}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Eye className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{analytics.totalViews.toLocaleString()}</p>
                            <p className="text-sm text-slate-400">{t('analytics_page.total_views')}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{analytics.averageViews}</p>
                            <p className="text-sm text-slate-400">{t('analytics_page.avg_views_per_secret')}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                            <Clock className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{analytics.activeSecrets}</p>
                            <p className="text-sm text-slate-400">{t('analytics_page.active_secrets')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                {/* Activity Chart */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">{t('analytics_page.daily_activity.title')}</h2>
                            <p className="text-sm text-slate-400">{t('analytics_page.daily_activity.description')}</p>
                        </div>
                    </div>

                    {/* Simple bar chart representation */}
                    <div className="space-y-4">
                        {analytics.dailyStats.map((day) => (
                            <div key={day.date} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">
                                        {new Date(day.date).toLocaleDateString(t('analytics_page.locale'), {
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                    <div className="flex space-x-4">
                                        <span className="text-teal-400">{day.secrets} {t('analytics_page.daily_activity.secrets')}</span>
                                        <span className="text-blue-400">{day.views} {t('analytics_page.daily_activity.views')}</span>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                                        <div
                                            className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${(day.secrets / 20) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${(day.views / 150) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                            <Users className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-md font-semibold text-white">{t('analytics_page.secret_types.title')}</h3>
                            <p className="text-sm text-slate-400">{t('analytics_page.secret_types.description')}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">{t('analytics_page.secret_types.password_protected')}</span>
                            <div className="flex items-center space-x-2">
                                <div className="w-16 bg-slate-700 rounded-full h-2">
                                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${analytics.secretTypes.passwordProtected}%` }} />
                                </div>
                                <span className="text-sm text-slate-400">{analytics.secretTypes.passwordProtected}%</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">{t('analytics_page.secret_types.ip_restricted')}</span>
                            <div className="flex items-center space-x-2">
                                <div className="w-16 bg-slate-700 rounded-full h-2">
                                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${analytics.secretTypes.ipRestricted}%` }} />
                                </div>
                                <span className="text-sm text-slate-400">{analytics.secretTypes.ipRestricted}%</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">{t('analytics_page.secret_types.burn_after_time')}</span>
                            <div className="flex items-center space-x-2">
                                <div className="w-16 bg-slate-700 rounded-full h-2">
                                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${analytics.secretTypes.burnable}%` }} />
                                </div>
                                <span className="text-sm text-slate-400">{analytics.secretTypes.burnable}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <Clock className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-md font-semibold text-white">{t('analytics_page.expiration_stats.title')}</h3>
                            <p className="text-sm text-slate-400">{t('analytics_page.expiration_stats.description')}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">{t('analytics_page.expiration_stats.one_hour')}</span>
                            <div className="flex items-center space-x-2">
                                <div className="w-16 bg-slate-700 rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${analytics.expirationStats.oneHour}%` }} />
                                </div>
                                <span className="text-sm text-slate-400">{analytics.expirationStats.oneHour}%</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">{t('analytics_page.expiration_stats.one_day')}</span>
                            <div className="flex items-center space-x-2">
                                <div className="w-16 bg-slate-700 rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${analytics.expirationStats.oneDay}%` }} />
                                </div>
                                <span className="text-sm text-slate-400">{analytics.expirationStats.oneDay}%</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">{t('analytics_page.expiration_stats.one_week_plus')}</span>
                            <div className="flex items-center space-x-2">
                                <div className="w-16 bg-slate-700 rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${analytics.expirationStats.oneWeekPlus}%` }} />
                                </div>
                                <span className="text-sm text-slate-400">{analytics.expirationStats.oneWeekPlus}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
