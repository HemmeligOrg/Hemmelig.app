import { IconFingerprint, IconList, IconLockOff } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

function SecondaryLink({ icon, color, label, route }) {
    const navigate = useNavigate();

    const colorClasses = {
        red: 'bg-red-500/20 text-red-400',
        gray: 'bg-gray-500/20 text-gray-400',
    };

    return (
        <button
            onClick={() => navigate(route)}
            className="w-full px-3 py-2 rounded-md text-left transition-colors
                     hover:bg-gray-700/50 text-gray-200 group"
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${colorClasses[color || 'gray']}`}>{icon}</div>
                <span className="text-sm">{label}</span>
            </div>
        </button>
    );
}

export default function SecondaryLinks() {
    const { t } = useTranslation();

    const data = [
        {
            label: t('public_list'),
            icon: <IconList size="1rem" stroke={1.5} />,
            route: '/public',
        },
        {
            label: t('privacy.title'),
            icon: <IconFingerprint size="1rem" stroke={1.5} />,
            route: '/account/privacy',
        },
        {
            label: t('terms.title'),
            icon: <IconList size="1rem" stroke={1.5} />,
            route: '/account/terms',
        },
        {
            icon: <IconLockOff size="1rem" stroke={1.5} />,
            color: 'red',
            label: t('sign_out'),
            route: '/signout',
        },
    ];

    return (
        <div className="pt-4 border-t border-gray-700 space-y-1">
            {data.map((link) => (
                <SecondaryLink {...link} key={link.label} />
            ))}
        </div>
    );
}
