import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const Analytics = () => {
    const { t } = useTranslation();

    const analyticsData = useLoaderData();

    // Process data for path visualization
    const pathCounts = analyticsData.reduce((acc, item) => {
        acc[item.path] = (acc[item.path] || 0) + 1;
        return acc;
    }, {});

    const pathChartData = Object.entries(pathCounts)
        .map(([path, count]) => ({
            path: path.length > 20 ? path.substring(0, 20) + '...' : path,
            visits: count,
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10); // Show top 10 most visited paths

    // Process data for time-based visualization
    const dailyVisits = analyticsData.reduce((acc, item) => {
        const date = new Date(item.timestamp).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    const timeChartData = Object.entries(dailyVisits)
        .map(([date, count]) => ({
            date,
            visits: count,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-30); // Show last 30 days

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
                        <p className="text-2xl font-bold text-white mt-1">{analyticsData.length}</p>
                    </div>
                    <div className="bg-gray-700/30 p-4 rounded-lg">
                        <h3 className="text-gray-400 text-sm">{t('analytics.unique_visitors')}</h3>
                        <p className="text-2xl font-bold text-white mt-1">
                            {new Set(analyticsData.map((item) => item.uniqueId)).size}
                        </p>
                    </div>
                    <div className="bg-gray-700/30 p-4 rounded-lg">
                        <h3 className="text-gray-400 text-sm">{t('analytics.unique_paths')}</h3>
                        <p className="text-2xl font-bold text-white mt-1">
                            {Object.keys(pathCounts).length}
                        </p>
                    </div>
                    <div className="bg-gray-700/30 p-4 rounded-lg">
                        <h3 className="text-gray-400 text-sm">{t('analytics.daily_average')}</h3>
                        <p className="text-2xl font-bold text-white mt-1">
                            {Math.round(analyticsData.length / Object.keys(dailyVisits).length)}
                        </p>
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

                {/* Most Visited Paths Chart */}
                <div className="bg-gray-700/30 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold text-white mb-4">
                        {t('analytics.most_visited_paths')}
                    </h2>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={pathChartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="path"
                                    tick={{ fill: '#9CA3AF' }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis tick={{ fill: '#9CA3AF' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="visits" fill="#818CF8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
