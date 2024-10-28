import { IconMoodConfuzed } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const NotFound = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4">
            <div className="max-w-md w-full space-y-8 text-center">
                {/* Fun 404 Animation */}
                <div className="relative">
                    <div className="text-[120px] font-bold text-gray-800/20 select-none">404</div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <IconMoodConfuzed size={64} className="text-gray-400 animate-bounce" />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h1 className="text-2xl font-bold text-white">{t('not_found.title')}</h1>
                    <p className="text-gray-400">{t('not_found.description')}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 
                                 bg-hemmelig text-white rounded-md hover:bg-hemmelig-700 
                                 transition-colors"
                    >
                        {t('not_found.go_home')}
                    </Link>
                    <Link
                        to="/api-docs"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 
                                 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 
                                 transition-colors"
                    >
                        {t('not_found.view_docs')}
                    </Link>
                </div>

                {/* Secret Cat Image */}
                <div className="flex justify-center mt-8">
                    <img
                        src="/static/secret_cat.png"
                        alt="Secret Cat"
                        className="w-32 h-32 object-contain opacity-30"
                    />
                </div>
            </div>
        </div>
    );
};

export default NotFound;
