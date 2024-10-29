import { IconCheck, IconCopy } from '@tabler/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const CopyButton = ({ textToCopy, className = '', size = 14 }) => {
    const [copied, setCopied] = useState(false);
    const { t } = useTranslation();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={`p-1 hover:bg-gray-700 rounded-md group transition-all duration-200 ${className}`}
            title={copied ? t('common.copied') : t('common.copy')}
        >
            {copied ? (
                <IconCheck size={size} className="text-green-500" />
            ) : (
                <IconCopy size={size} className="text-gray-400 group-hover:text-gray-300" />
            )}
        </button>
    );
};

export default CopyButton;
