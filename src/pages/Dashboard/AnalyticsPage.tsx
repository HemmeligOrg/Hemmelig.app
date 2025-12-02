import { BarChart3, Calendar, Clock, Eye, Globe, Shield, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
import { toast } from 'sonner';
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
}

type TimeRange = '7d' | '30d' | '90d' | '1y';

export function AnalyticsPage() {
  const initialAnalytics = useLoaderData() as AnalyticsLoaderData;
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(
    initialAnalytics.error ? null : (initialAnalytics as AnalyticsData)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialAnalytics.error || null);
  const [visitorStats, setVisitorStats] = useState<DailyVisitor[]>([]);
  const [visitorLoading, setVisitorLoading] = useState(false);

  const fetchAnalytics = async (range: TimeRange) => {
    setLoading(true);
    try {
      const res = await api.analytics.$get({ query: { timeRange: range } });
      if (res.status === 403) {
        toast.error("You don't have permission to view analytics.");
        setAnalytics(null);
        setError("You don't have permission to view analytics.");
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setAnalytics(data as AnalyticsData);
      setError(null);
    } catch {
      toast.error('Failed to fetch analytics data.');
      setError('Failed to fetch analytics data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitorStats = async () => {
    setVisitorLoading(true);
    try {
      const res = await api.analytics.visitors.daily.$get();
      if (!res.ok) throw new Error('Failed to fetch visitor stats');
      const data = await res.json();
      setVisitorStats(data as DailyVisitor[]);
    } catch (err) {
      console.error('Failed to fetch visitor stats:', err);
    } finally {
      setVisitorLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitorStats();
  }, []);

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimeRange = e.target.value as TimeRange;
    setTimeRange(newTimeRange);
    fetchAnalytics(newTimeRange);
  };

  const totalUniqueVisitors = visitorStats.reduce((acc, day) => acc + day.unique_visitors, 0);
  const totalPageViews = visitorStats.reduce((acc, day) => acc + day.total_visits, 0);
  const maxVisitors = Math.max(...visitorStats.map(d => d.unique_visitors), 1);
  const maxViews = Math.max(...visitorStats.map(d => d.total_visits), 1);

  const timeRangeOptions = [
    { value: '7d', label: t('analytics_page.time_range.last_7_days') },
    { value: '30d', label: t('analytics_page.time_range.last_30_days') },
    { value: '90d', label: t('analytics_page.time_range.last_90_days') },
    { value: '1y', label: t('analytics_page.time_range.last_year') },
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
    return <div className="p-8 text-center">Loading analytics...</div>;
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
            <p className="text-gray-500 dark:text-slate-400 mt-1">{t('analytics_page.description')}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Activity Chart */}
        <div className="bg-white dark:bg-dark-800/80 backdrop-blur-sm border border-gray-200 dark:border-dark-600 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-500/20 ">
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

          {/* Simple bar chart representation */}
          <div className="space-y-4">
            {analytics.dailyStats.map((day) => (
              <div key={day.date} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">
                    {new Date(day.date).toLocaleDateString(
                      t('analytics_page.locale'),
                      {
                        month: 'short',
                        day: 'numeric',
                      }
                    )}
                  </span>
                  <div className="flex space-x-4">
                    <span className="text-teal-400">
                      {day.secrets}{' '}
                      {t('analytics_page.daily_activity.secrets')}
                    </span>
                    <span className="text-blue-400">
                      {day.views} {t('analytics_page.daily_activity.views')}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1 bg-gray-200 dark:bg-dark-700 h-2 overflow-hidden">
                    <div
                      className="bg-teal-500 h-2 transition-all duration-500"
                      style={{ width: `${Math.min((day.secrets / 20) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-dark-700 h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-2 transition-all duration-500"
                      style={{ width: `${Math.min((day.views / 150) * 100, 100)}%` }}
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
                  Visitor Analytics
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Page views and unique visitors (last 30 days)
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="text-gray-600 dark:text-slate-300">
                  {totalUniqueVisitors.toLocaleString()} unique
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-gray-600 dark:text-slate-300">
                  {totalPageViews.toLocaleString()} views
                </span>
              </div>
            </div>
          </div>

          {visitorLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              Loading visitor data...
            </div>
          ) : visitorStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              No visitor data available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {visitorStats.map((day) => (
                <div key={day.date} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">
                      {new Date(day.date).toLocaleDateString(t('analytics_page.locale'), {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <div className="flex space-x-4">
                      <span className="text-indigo-400">
                        {day.unique_visitors} unique
                      </span>
                      <span className="text-emerald-400">
                        {day.total_visits} views
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-dark-700 h-2 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-2 transition-all duration-500"
                        style={{ width: `${Math.min((day.unique_visitors / maxVisitors) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-dark-700 h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 transition-all duration-500"
                        style={{ width: `${Math.min((day.total_visits / maxViews) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
