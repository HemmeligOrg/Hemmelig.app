import { Navigate, useLoaderData } from 'react-router-dom';
import ErrorBox from '../../components/error-box';

import { IconInfoCircle, IconRocket } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

const HomeAccount = () => {
    const { t } = useTranslation();

    const userInfo = useLoaderData();

    if (userInfo?.error || [401, 500].includes(userInfo.statusCode)) {
        return (
            <div className="animate-fadeIn">
                <ErrorBox message={userInfo.error ? userInfo.error : t('not_logged_in')} />
            </div>
        );
    }

    const { user = {} } = userInfo;

    if (!user?.username) {
        return <Navigate replace to="/signin" />;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            {/* First Time User Message */}
            {user?.generated && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 space-y-2">
                    <div className="flex items-center gap-2 text-yellow-500">
                        <IconInfoCircle size={20} />
                        <h2 className="font-semibold">{t('account.home.update_password')}</h2>
                    </div>
                    <p className="text-yellow-500/90">{t('account.home.first_time_message')}</p>
                </div>
            )}

            {/* Welcome Message */}
            <div className="bg-gray-800/50 rounded-lg p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-gray-700 pb-4">
                    <div className="p-2 bg-gray-700 rounded-lg">
                        <IconRocket size={24} className="text-gray-300" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-white">
                            {t('account.home.hi')},{' '}
                            <span className="text-gray-300">{user.username}</span>
                        </h1>
                        <p className="text-sm text-gray-400">{t('account.home.intro')}</p>
                    </div>
                </div>

                {/* Features List */}
                <div className="space-y-4">
                    <h2 className="text-lg font-medium text-white">
                        {t('account.home.features')}:
                    </h2>
                    <ul className="space-y-3 text-gray-300">
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                            {t('account.home.upload_files')}
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                            {t('account.home.expiration')}
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                            {t('account.home.secrets')}
                        </li>
                    </ul>
                </div>

                {/* More Info */}
                <div className="pt-4 border-t border-gray-700">
                    <p className="text-gray-400">
                        {t('account.home.more')}
                        <span
                            className="inline-flex gap-1 ml-2"
                            role="img"
                            aria-label="celebration"
                        >
                            <span className="animate-bounce">🎉</span>
                            <span className="animate-bounce [animation-delay:100ms]">🎉</span>
                            <span className="animate-bounce [animation-delay:200ms]">🎉</span>
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HomeAccount;
