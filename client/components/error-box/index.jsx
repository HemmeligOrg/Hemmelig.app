import { IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const ErrorBox = ({ message, title = 'home.bummer' }) => {
    const { t } = useTranslation();

    return (
        <div className="flex p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex-shrink-0 text-red-400">
                <IconAlertCircle size="1.25rem" />
            </div>
            <div className="ml-3">
                <h3 className="text-sm font-medium text-red-400">{t(title)}</h3>
                <div className="mt-1 text-sm text-red-300">{message}</div>
            </div>
        </div>
    );
};

export default ErrorBox;
