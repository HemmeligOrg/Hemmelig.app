import { IconCheck } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

const SuccessBox = ({ message, title = 'settings.success' }) => {
    const { t } = useTranslation();

    return (
        <div className="flex p-4 bg-teal-500/10 border border-teal-500/20 rounded-lg">
            <div className="flex-shrink-0 text-teal-400">
                <IconCheck size="1.25rem" />
            </div>
            <div className="ml-3">
                <h3 className="text-sm font-medium text-teal-400">{t(title)}</h3>
                <div className="mt-1 text-sm text-teal-300">{t(message)}</div>
            </div>
        </div>
    );
};

export default SuccessBox;
