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

    // Custom tooltip component for better control
    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;
        return (
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <p className="text-gray-200">{`${label}: ${payload[0].value}`}</p>
            </div>
        );
    };

    const chartData = [
        { name: t('statistics.total_secrets'), value: stats?.totalSecretsCreated || 0 },
        { name: t('statistics.active_secrets'), value: stats?.activeSecrets || 0 },
        { name: t('statistics.public_secrets'), value: stats?.isPublicSecrets || 0 },
    ];

    const securityData = [
        { name: t('statistics.password_protected'), value: stats?.secretsWithPassword || 0 },
        { name: t('statistics.ip_restricted'), value: stats?.secretsWithIpRestriction || 0 },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-4">{t('statistics.heading')}</h1>
                <p className="text-gray-400">{t('statistics.description')}</p>
            </div>

            {/* Stats Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: t('statistics.total_secrets'), value: stats?.totalSecretsCreated },
                    { label: t('statistics.active_secrets'), value: stats?.activeSecrets },
                    { label: t('statistics.total_users'), value: stats?.totalUsers },
                    { label: t('statistics.total_files'), value: stats?.totalFiles },
                ].map((item, index) => (
                    <div
                        key={index}
                        className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50"
                    >
                        <h3 className="text-gray-400 text-sm">{item.label}</h3>
                        <p className="text-2xl font-bold text-white mt-2">{item.value || 0}</p>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Simplified Bar Chart */}
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                    <h2 className="text-xl font-semibold text-white mb-6">
                        {t('statistics.overview')}
                    </h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#9CA3AF' }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis tick={{ fill: '#9CA3AF' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" fill="#818CF8">
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#818CF8" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Simplified Pie Chart */}
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                    <h2 className="text-xl font-semibold text-white mb-6">
                        {t('statistics.security_features')}
                    </h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={securityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#818CF8" />
                                    <Cell fill="#34D399" />
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                        {securityData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div
                                    className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-[#818CF8]' : 'bg-[#34D399]'}`}
                                />
                                <span className="text-gray-400 text-sm">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;
