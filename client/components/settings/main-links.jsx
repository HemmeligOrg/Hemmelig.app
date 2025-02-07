import { IconChartBar, IconLock, IconSettings, IconUser } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

function MainLink({ icon, color, label, route }) {
    const navigate = useNavigate();

    const colorClasses = {
        blue: 'bg-blue-500/20 text-blue-400',
        teal: 'bg-teal-500/20 text-teal-400',
        violet: 'bg-violet-500/20 text-violet-400',
        grape: 'bg-purple-500/20 text-purple-400',
        orange: 'bg-orange-500/20 text-orange-400',
    };

    return (
        <button
            onClick={() => navigate(`/account/${route}`)}
            className="w-full px-3 py-2 rounded-md text-left transition-colors
                     hover:bg-gray-700/50 text-gray-200 group"
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${colorClasses[color]}`}>{icon}</div>
                <span className="text-sm">{label}</span>
            </div>
        </button>
    );
}

export default function MainLinks() {
    const { t } = useTranslation();

    const data = [
        {
            icon: <IconUser size="1rem" />,
            color: 'blue',
            label: t('account.home.title'),
            route: 'account',
        },
        {
            icon: <IconLock size="1rem" />,
            color: 'teal',
            label: t('secrets.secrets'),
            route: 'secrets',
        },
        {
            icon: <IconSettings size="1rem" />,
            color: 'violet',
            label: t('instance_settings'),
            route: 'instance-settings',
        },
        {
            icon: <IconUser size="1rem" />,
            color: 'grape',
            label: t('account_settings'),
            route: 'account-settings',
        },
        {
            icon: <IconUser size="1rem" />,
            color: 'grape',
            label: t('users.users'),
            route: 'users',
        },
        {
            icon: <IconChartBar size="1rem" />,
            color: 'orange',
            label: t('analytics.title'),
            route: 'analytics',
        },
    ];

    return (
        <div className="space-y-1">
            {data.map((link) => (
                <MainLink {...link} key={link.label} />
            ))}
        </div>
    );
}
