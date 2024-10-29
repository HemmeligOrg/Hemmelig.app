import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const Statistics = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                setStats(data);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchStats();
    }, []);

    if (error) {
        return (
            <div className="text-red-500 text-center p-4">
                {t('error.failed_to_load_statistics')}
            </div>
        );
    }

    if (!stats) {
        return <div className="text-gray-400 text-center p-4">{t('loading')}</div>;
    }

    const barChartData = [
        {
            name: t('statistics.total_secrets'),
            value: stats.totalSecretsCreated,
        },
        {
            name: t('statistics.active_secrets'),
            value: stats.activeSecrets,
        },
        {
            name: t('statistics.public_secrets'),
            value: stats.isPublicSecrets,
        },
        {
            name: t('statistics.total_users'),
            value: stats.totalUsers,
        },
        {
            name: t('statistics.total_files'),
            value: stats.totalFiles,
        },
    ];

    const pieChartData = [
        {
            name: t('statistics.password_protected'),
            value: stats.secretsWithPassword,
        },
        {
            name: t('statistics.ip_restricted'),
            value: stats.secretsWithIpRestriction,
        },
    ];

    const COLORS = ['#818CF8', '#34D399', '#FBBF24', '#F87171', '#A78BFA'];
    const HOVER_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    // Update the tooltip style object for both charts
    const tooltipStyle = {
        backgroundColor: '#1F2937',
        border: '1px solid #374151',
        borderRadius: '0.75rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        color: 'white',
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-white">{t('statistics.heading')}</h1>
                <p className="text-gray-400 max-w-2xl mx-auto">{t('statistics.description')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 shadow-xl transition-transform hover:scale-[1.02]">
                    <h2 className="text-xl font-semibold text-white mb-6">
                        {t('statistics.overview')}
                    </h2>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={70}
                                />
                                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Bar
                                    dataKey="value"
                                    fill="#818CF8"
                                    radius={[4, 4, 0, 0]}
                                    hover={{ fill: '#6366F1' }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 shadow-xl transition-transform hover:scale-[1.02]">
                    <h2 className="text-xl font-semibold text-white mb-6">
                        {t('statistics.security_features')}
                    </h2>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={({ name, percent }) =>
                                        `${name}: ${(percent * 100).toFixed(0)}%`
                                    }
                                    outerRadius={140}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieChartData.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            onMouseEnter={(_, index) => {
                                                // Optional: Add hover effect
                                                return HOVER_COLORS[index % HOVER_COLORS.length];
                                            }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Average Views Card */}
                <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 shadow-xl col-span-full lg:col-span-1 transition-transform hover:scale-[1.02]">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        {t('statistics.average_views')}
                    </h2>
                    <div className="flex items-end gap-2">
                        <div className="text-5xl font-bold text-indigo-400">
                            {stats.averageViewsPerSecret}
                        </div>
                        <p className="text-gray-400 mb-2">{t('statistics.views_per_secret')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;
