import {
    BarChart3,
    Calendar,
    Clock,
    Eye,
    Globe,
    Shield,
    TrendingDown,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
import { toast } from 'sonner';
import { Sparkline } from '../../components/Sparkline';
import { api } from '../../lib/api';

interface DailyVisitor {
    date: string;
    unique_visitors: number;
    total_visits: number;
    paths: string;
}

interface DailyStat {
    date: string;
    secrets: number;
    views: number;
}

interface SecretTypes {
    passwordProtected: number;
    ipRestricted: number;
    burnable: number;
}

interface ExpirationStats {
    oneHour: number;
    oneDay: number;
    oneWeekPlus: number;
}

interface AnalyticsData {
    totalSecrets: number;
    totalViews: number;
    averageViews: number;
    activeSecrets: number;
    expiredSecrets: number;
    dailyStats: DailyStat[];
    secretTypes: SecretTypes;
    expirationStats: ExpirationStats;
}

interface AnalyticsLoaderData {
    error?: string;
    totalSecrets?: number;
    totalViews?: number;
    averageViews?: number;
    activeSecrets?: number;
    expiredSecrets?: number;
    dailyStats?: DailyStat[];
    secretTypes?: SecretTypes;
    expirationStats?: ExpirationStats;
    visitorStats?: DailyVisitor[];
}

type TimeRange = '7d' | '14d' | '30d';

export function AnalyticsPage() {
    const initialAnalytics = useLoaderData() as AnalyticsLoaderData;
    const [timeRange, setTimeRange] = useState<TimeRange>('30d');
    const { t } = useTranslation();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(
        initialAnalytics.error ? null : (initialAnalytics as AnalyticsData)
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(initialAnalytics.error || null);
    const [visitorStats, setVisitorStats] = useState<DailyVisitor[]>(
        initialAnalytics.visitorStats || []
    );

    const fetchAnalytics = async (range: TimeRange) => {
        setLoading(true);
        try {
            const [analyticsRes, visitorRes] = await Promise.all([
                api.analytics.$get({ query: { timeRange: range } }),
                api.analytics.visitors.daily.$get({ query: { timeRange: range } }),
            ]);
            if (analyticsRes.status === 403) {
                toast.error(t('analytics_page.no_permission'));
                setAnalytics(null);
                setError(t('analytics_page.no_permission'));
                return;
            }
            if (!analyticsRes.ok) throw new Error('Failed to fetch');
            const data = await analyticsRes.json();
            setAnalytics(data as AnalyticsData);

            if (visitorRes.ok) {
                const visitorData = await visitorRes.json();
                setVisitorStats(visitorData as DailyVisitor[]);
            }

            setError(null);
        } catch {
            toast.error(t('analytics_page.failed_to_fetch'));
            setError(t('analytics_page.failed_to_fetch'));
        } finally {
            setLoading(false);
        }
    };

    const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTimeRange = e.target.value as TimeRange;
        setTimeRange(newTimeRange);
        fetchAnalytics(newTimeRange);
    };

    const totalUniqueVisitors = visitorStats.reduce((acc, day) => acc + day.unique_visitors, 0);
    const totalPageViews = visitorStats.reduce((acc, day) => acc + day.total_visits, 0);

    const timeRangeOptions = [
        { value: '7d', label: t('analytics_page.time_range.last_7_days') },
        { value: '14d', label: t('analytics_page.time_range.last_14_days') },
        { value: '30d', label: t('analytics_page.time_range.last_30_days') },
    ];

    if (error) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-red-500">Error</h2>
                <p className="text-gray-500 dark:text-slate-400 mt-2">{error}</p>
            </div>
        );
    }

    if (loading) {
        return <div className="p-8 text-center">{t('analytics_page.loading')}</div>;
    }

    if (!analytics) {
        return <div className="p-8 text-center">Could not load analytics.</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 overflow-hidden">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            {t('analytics_page.title')}
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 mt-1">
                            {t('analytics_page.description')}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                        <select
                            value={timeRange}
                            onChange={handleTimeRangeChange}
                            className="bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 px-3 py-2 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
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
                <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-teal-500/20 ">
                            <Shield className="w-6 h-6 text-teal-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {analytics.totalSecrets}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {t('analytics_page.total_secrets')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/20 ">
                            <Eye className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {analytics.totalViews.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {t('analytics_page.total_views')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-500/20 ">
                            <BarChart3 className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {analytics.averageViews}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {t('analytics_page.avg_views_per_secret')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-500/20 ">
                            <Clock className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {analytics.activeSecrets}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {t('analytics_page.active_secrets')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Chart */}
            <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-purple-500/20">
                        <BarChart3 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t('analytics_page.daily_activity.title')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            {t('analytics_page.daily_activity.description')}
                        </p>
                    </div>
                </div>

                {analytics.dailyStats.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                        {t('analytics_page.daily_activity.no_data')}
                    </div>
                ) : (
                    <>
                        {/* Summary Cards with Sparklines */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-600 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">
                                            {t('analytics_page.daily_activity.secrets_created')}
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {analytics.dailyStats
                                                .reduce((acc, d) => acc + d.secrets, 0)
                                                .toLocaleString()}
                                        </p>
                                        {analytics.dailyStats.length >= 2 && (
                                            <div className="flex items-center mt-1 text-xs">
                                                {analytics.dailyStats[
                                                    analytics.dailyStats.length - 1
                                                ].secrets >=
                                                analytics.dailyStats[
                                                    analytics.dailyStats.length - 2
                                                ].secrets ? (
                                                    <TrendingUp className="w-3 h-3 text-emerald-500 mr-1" />
                                                ) : (
                                                    <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                                                )}
                                                <span className="text-gray-500 dark:text-slate-400">
                                                    {t('analytics_page.daily_activity.vs_previous')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <Sparkline
                                        data={analytics.dailyStats.map((d) => d.secrets)}
                                        width={100}
                                        height={40}
                                        color="#14b8a6"
                                        className="text-teal-500"
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-600 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">
                                            {t('analytics_page.daily_activity.secret_views')}
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {analytics.dailyStats
                                                .reduce((acc, d) => acc + d.views, 0)
                                                .toLocaleString()}
                                        </p>
                                        {analytics.dailyStats.length >= 2 && (
                                            <div className="flex items-center mt-1 text-xs">
                                                {analytics.dailyStats[
                                                    analytics.dailyStats.length - 1
                                                ].views >=
                                                analytics.dailyStats[
                                                    analytics.dailyStats.length - 2
                                                ].views ? (
                                                    <TrendingUp className="w-3 h-3 text-emerald-500 mr-1" />
                                                ) : (
                                                    <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                                                )}
                                                <span className="text-gray-500 dark:text-slate-400">
                                                    {t('analytics_page.daily_activity.vs_previous')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <Sparkline
                                        data={analytics.dailyStats.map((d) => d.views)}
                                        width={100}
                                        height={40}
                                        color="#3b82f6"
                                        className="text-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Compact Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-dark-600">
                                        <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-slate-400">
                                            {t('analytics_page.daily_activity.date')}
                                        </th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-slate-400">
                                            <div className="flex items-center justify-end space-x-1">
                                                <Shield className="w-3 h-3" />
                                                <span>
                                                    {t('analytics_page.daily_activity.secrets')}
                                                </span>
                                            </div>
                                        </th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-slate-400">
                                            <div className="flex items-center justify-end space-x-1">
                                                <Eye className="w-3 h-3" />
                                                <span>
                                                    {t('analytics_page.daily_activity.views')}
                                                </span>
                                            </div>
                                        </th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-slate-400 hidden sm:table-cell">
                                            {t('analytics_page.daily_activity.trend')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                                    {[...analytics.dailyStats].reverse().map((day, index, arr) => {
                                        const prevDay = arr[index + 1];
                                        const secretsChange = prevDay
                                            ? day.secrets - prevDay.secrets
                                            : 0;
                                        return (
                                            <tr
                                                key={day.date}
                                                className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
                                            >
                                                <td className="py-2 px-3 text-gray-900 dark:text-white">
                                                    {new Date(day.date).toLocaleDateString(
                                                        t('analytics_page.locale'),
                                                        {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        }
                                                    )}
                                                </td>
                                                <td className="py-2 px-3 text-right font-medium text-teal-600 dark:text-teal-400">
                                                    {day.secrets.toLocaleString()}
                                                </td>
                                                <td className="py-2 px-3 text-right font-medium text-blue-600 dark:text-blue-400">
                                                    {day.views.toLocaleString()}
                                                </td>
                                                <td className="py-2 px-3 text-right hidden sm:table-cell">
                                                    {prevDay && (
                                                        <span
                                                            className={`inline-flex items-center text-xs ${
                                                                secretsChange > 0
                                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                                    : secretsChange < 0
                                                                      ? 'text-red-600 dark:text-red-400'
                                                                      : 'text-gray-400 dark:text-slate-500'
                                                            }`}
                                                        >
                                                            {secretsChange > 0 ? '+' : ''}
                                                            {secretsChange}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Additional Stats */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-yellow-500/20 ">
                            <Users className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                                {t('analytics_page.secret_types.title')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {t('analytics_page.secret_types.description')}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-slate-300">
                                {t('analytics_page.secret_types.password_protected')}
                            </span>
                            <div className="flex items-center space-x-2">
                                <div className="w-16 bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                                    <div
                                        className="bg-yellow-500 h-2 rounded-full"
                                        style={{
                                            width: `${analytics.secretTypes.passwordProtected}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-sm text-gray-500 dark:text-slate-400">
                                    {analytics.secretTypes.passwordProtected}%
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-slate-300">
                                {t('analytics_page.secret_types.ip_restricted')}
                            </span>
                            <div className="flex items-center space-x-2">
                                <div className="w-16 bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                                    <div
                                        className="bg-yellow-500 h-2 rounded-full"
                                        style={{ width: `${analytics.secretTypes.ipRestricted}%` }}
                                    />
                                </div>
                                <span className="text-sm text-gray-500 dark:text-slate-400">
                                    {analytics.secretTypes.ipRestricted}%
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-slate-300">
                                {t('analytics_page.secret_types.burn_after_time')}
                            </span>
                            <div className="flex items-center space-x-2">
                                <div className="w-16 bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                                    <div
                                        className="bg-yellow-500 h-2 rounded-full"
                                        style={{ width: `${analytics.secretTypes.burnable}%` }}
                                    />
                                </div>
                                <span className="text-sm text-gray-500 dark:text-slate-400">
                                    {analytics.secretTypes.burnable}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-red-500/20 ">
                            <Clock className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                                {t('analytics_page.expiration_stats.title')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {t('analytics_page.expiration_stats.description')}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-slate-300">
                                {t('analytics_page.expiration_stats.one_hour')}
                            </span>
                            <div className="flex items-center space-x-2">
                                <div className="w-16 bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                                    <div
                                        className="bg-red-500 h-2 rounded-full"
                                        style={{ width: `${analytics.expirationStats.oneHour}%` }}
                                    />
                                </div>
                                <span className="text-sm text-gray-500 dark:text-slate-400">
                                    {analytics.expirationStats.oneHour}%
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-slate-300">
                                {t('analytics_page.expiration_stats.one_day')}
                            </span>
                            <div className="flex items-center space-x-2">
                                <div className="w-16 bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                                    <div
                                        className="bg-red-500 h-2 rounded-full"
                                        style={{ width: `${analytics.expirationStats.oneDay}%` }}
                                    />
                                </div>
                                <span className="text-sm text-gray-500 dark:text-slate-400">
                                    {analytics.expirationStats.oneDay}%
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-slate-300">
                                {t('analytics_page.expiration_stats.one_week_plus')}
                            </span>
                            <div className="flex items-center space-x-2">
                                <div className="w-16 bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                                    <div
                                        className="bg-red-500 h-2 rounded-full"
                                        style={{
                                            width: `${analytics.expirationStats.oneWeekPlus}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-sm text-gray-500 dark:text-slate-400">
                                    {analytics.expirationStats.oneWeekPlus}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visitor Analytics Section */}
            <div className="mt-8">
                <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-500/20">
                                <Globe className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t('analytics_page.visitor_analytics.title')}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    {t('analytics_page.visitor_analytics.description')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {visitorStats.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                            {t('analytics_page.visitor_analytics.no_data')}
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards with Sparklines */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-600 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                                {t('analytics_page.visitor_analytics.unique')}
                                            </p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {totalUniqueVisitors.toLocaleString()}
                                            </p>
                                            {visitorStats.length >= 2 && (
                                                <div className="flex items-center mt-1 text-xs">
                                                    {visitorStats[visitorStats.length - 1]
                                                        .unique_visitors >=
                                                    visitorStats[visitorStats.length - 2]
                                                        .unique_visitors ? (
                                                        <TrendingUp className="w-3 h-3 text-emerald-500 mr-1" />
                                                    ) : (
                                                        <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                                                    )}
                                                    <span className="text-gray-500 dark:text-slate-400">
                                                        {t(
                                                            'analytics_page.visitor_analytics.vs_previous'
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <Sparkline
                                            data={visitorStats.map((d) => d.unique_visitors)}
                                            width={100}
                                            height={40}
                                            color="#6366f1"
                                            className="text-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-600 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                                {t('analytics_page.visitor_analytics.views')}
                                            </p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {totalPageViews.toLocaleString()}
                                            </p>
                                            {visitorStats.length >= 2 && (
                                                <div className="flex items-center mt-1 text-xs">
                                                    {visitorStats[visitorStats.length - 1]
                                                        .total_visits >=
                                                    visitorStats[visitorStats.length - 2]
                                                        .total_visits ? (
                                                        <TrendingUp className="w-3 h-3 text-emerald-500 mr-1" />
                                                    ) : (
                                                        <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                                                    )}
                                                    <span className="text-gray-500 dark:text-slate-400">
                                                        {t(
                                                            'analytics_page.visitor_analytics.vs_previous'
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <Sparkline
                                            data={visitorStats.map((d) => d.total_visits)}
                                            width={100}
                                            height={40}
                                            color="#10b981"
                                            className="text-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Compact Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-dark-600">
                                            <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-slate-400">
                                                {t('analytics_page.visitor_analytics.date')}
                                            </th>
                                            <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-slate-400">
                                                <div className="flex items-center justify-end space-x-1">
                                                    <Users className="w-3 h-3" />
                                                    <span>
                                                        {t(
                                                            'analytics_page.visitor_analytics.unique'
                                                        )}
                                                    </span>
                                                </div>
                                            </th>
                                            <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-slate-400">
                                                <div className="flex items-center justify-end space-x-1">
                                                    <Eye className="w-3 h-3" />
                                                    <span>
                                                        {t(
                                                            'analytics_page.visitor_analytics.views'
                                                        )}
                                                    </span>
                                                </div>
                                            </th>
                                            <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-slate-400 hidden sm:table-cell">
                                                {t('analytics_page.visitor_analytics.trend')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                                        {[...visitorStats].reverse().map((day, index, arr) => {
                                            const prevDay = arr[index + 1];
                                            const change = prevDay
                                                ? day.unique_visitors - prevDay.unique_visitors
                                                : 0;
                                            return (
                                                <tr
                                                    key={day.date}
                                                    className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
                                                >
                                                    <td className="py-2 px-3 text-gray-900 dark:text-white">
                                                        {new Date(day.date).toLocaleDateString(
                                                            t('analytics_page.locale'),
                                                            {
                                                                weekday: 'short',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            }
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-medium text-indigo-600 dark:text-indigo-400">
                                                        {day.unique_visitors.toLocaleString()}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                                                        {day.total_visits.toLocaleString()}
                                                    </td>
                                                    <td className="py-2 px-3 text-right hidden sm:table-cell">
                                                        {prevDay && (
                                                            <span
                                                                className={`inline-flex items-center text-xs ${
                                                                    change > 0
                                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                                        : change < 0
                                                                          ? 'text-red-600 dark:text-red-400'
                                                                          : 'text-gray-400 dark:text-slate-500'
                                                                }`}
                                                            >
                                                                {change > 0 ? '+' : ''}
                                                                {change}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
