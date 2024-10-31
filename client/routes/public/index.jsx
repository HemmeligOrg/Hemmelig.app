import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslation } from 'react-i18next';
import { Link, useLoaderData, useParams } from 'react-router-dom';

dayjs.extend(relativeTime);

const PublicSecrets = () => {
    const { t } = useTranslation();
    const secrets = useLoaderData();
    const { username = '' } = useParams();

    const getTime = (expiresAt) => {
        return dayjs().to(dayjs(expiresAt));
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <h1 className="text-2xl font-semibold text-white text-center">
                {t('public.heading')} {username && `${t('public.of')} ${username}`}
            </h1>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                {t('public.title')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                {t('public.username')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                {t('public.expires')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                        {secrets.map((secret) => (
                            <tr key={secret.id} className="hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link
                                        to={`/secret/${secret.id}#encryption_key=public`}
                                        className="text-gray-300 hover:text-white transition-colors"
                                    >
                                        {(secret.title.length > 40
                                            ? secret.title.slice(0, 40) + '...'
                                            : secret.title) || secret.id}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link
                                        to={`/public/${secret.user?.username ?? 1337}`}
                                        className="text-gray-300 hover:text-white transition-colors"
                                    >
                                        {secret.user?.username ?? 'Anonymous'}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                    {getTime(secret.expiresAt)}
                                </td>
                            </tr>
                        ))}
                        {secrets.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-3">
                                        <svg
                                            className="w-8 h-8"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PublicSecrets;
