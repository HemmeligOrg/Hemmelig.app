import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import ErrorBox from '../../components/error-box';

const Analytics = () => {
    const { t } = useTranslation();
    const [analyticsData, stats] = useLoaderData();

    // Handle error cases
    if (analyticsData?.statusCode === 403) {
        return (
            <div className="animate-fadeIn">
                <ErrorBox message={analyticsData?.error} />
            </div>
        );
    }

    // Process data for path visualization
    const pathCounts = analyticsData.reduce((acc, item) => {
        acc[item.path] = (acc[item.path] || 0) + 1;
        return acc;
    }, {});

    // Process data for time-based visualization
    const timeChartData = analyticsData.map((item) => ({
        date: item.date,
        visits: item.total_visits,
    }));

    const totalVisits = analyticsData.reduce((acc, item) => acc + item.total_visits, 0);
    const uniqueVisitors = analyticsData.reduce((acc, item) => acc + item.unique_visitors, 0);
    const uniquePaths = Object.keys(pathCounts).length;
    const dailyAverage = Math.round(totalVisits / analyticsData.length);

    // Custom tooltip component
    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;
        return (
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <p className="text-gray-200">{`${label}: ${payload[0].value} visits`}</p>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            <div className="bg-gray-800/50 rounded-lg p-6">
                <h1 className="text-2xl font-semibold text-white mb-6">{t('analytics.title')}</h1>

                {/* Analytics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-700/30 p-4 rounded-lg">
                        <h3 className="text-gray-400 text-sm">{t('analytics.total_visits')}</h3>
                        <p className="text-2xl font-bold text-white mt-1">{totalVisits}</p>
                    </div>
                    <div className="bg-gray-700/30 p-4 rounded-lg">
                        <h3 className="text-gray-400 text-sm">{t('analytics.unique_visitors')}</h3>
                        <p className="text-2xl font-bold text-white mt-1">{uniqueVisitors}</p>
                    </div>
                    <div className="bg-gray-700/30 p-4 rounded-lg">
                        <h3 className="text-gray-400 text-sm">{t('analytics.unique_paths')}</h3>
                        <p className="text-2xl font-bold text-white mt-1">{uniquePaths}</p>
                    </div>
                    <div className="bg-gray-700/30 p-4 rounded-lg">
                        <h3 className="text-gray-400 text-sm">{t('analytics.daily_average')}</h3>
                        <p className="text-2xl font-bold text-white mt-1">{dailyAverage}</p>
                    </div>
                </div>

                {/* Daily Visits Chart */}
                <div className="bg-gray-700/30 p-4 rounded-lg mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4">
                        {t('analytics.daily_visits')}
                    </h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={timeChartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: '#9CA3AF' }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis tick={{ fill: '#9CA3AF' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="visits"
                                    stroke="#818CF8"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-gray-700/30 p-4 rounded-lg">
                        <h3 className="text-gray-400 text-sm">
                            {t('analytics.total_secrets_created')}
                        </h3>
                        <p className="text-2xl font-bold text-white mt-1">
                            {stats?.totalSecretsCreated || 0}
                        </p>
                    </div>

                    <div className="bg-gray-700/30 p-4 rounded-lg">
                        <h3 className="text-gray-400 text-sm">{t('analytics.active_secrets')}</h3>
                        <p className="text-2xl font-bold text-white mt-1">
                            {stats?.activeSecrets || 0}
                        </p>
                    </div>

                    <div className="bg-gray-700/30 p-4 rounded-lg">
                        <h3 className="text-gray-400 text-sm">{t('analytics.public_secrets')}</h3>
                        <p className="text-2xl font-bold text-white mt-1">
                            {stats?.isPublicSecrets || 0}
                        </p>
                    </div>

                    <div className="bg-gray-700/30 p-4 rounded-lg">
                        <h3 className="text-gray-400 text-sm">
                            {t('analytics.password_protected')}
                        </h3>
                        <p className="text-2xl font-bold text-white mt-1">
                            {stats?.secretsWithPassword || 0}
                        </p>
                    </div>

                    <div className="bg-gray-700/30 p-4 rounded-lg">
                        <h3 className="text-gray-400 text-sm">{t('analytics.ip_restricted')}</h3>
                        <p className="text-2xl font-bold text-white mt-1">
                            {stats?.secretsWithIpRestriction || 0}
                        </p>
                    </div>

                    <div className="bg-gray-700/30 p-4 rounded-lg">
                        <h3 className="text-gray-400 text-sm">
                            {t('analytics.average_max_views')}
                        </h3>
                        <p className="text-2xl font-bold text-white mt-1">
                            {stats?.averageMaxViewsPerSecret || 0}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
