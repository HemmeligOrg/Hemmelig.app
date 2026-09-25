import { X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-markdown';
import { hashString } from '../lib/hash';
import { useHemmeligStore } from '../store/hemmeligStore';

const DISMISS_KEY_PREFIX = 'importantAlertDismissed_';

/** The instance-wide notice banner above the header. A dismissal lasts 7 days. */
export function ImportantAlert() {
    const { t } = useTranslation();
    const { settings } = useHemmeligStore();

    const getDismissKey = () => DISMISS_KEY_PREFIX + hashString(settings.importantMessage || '');

    const isDismissedInStorage = () => {
        if (!settings.importantMessage) return false;
        const dismissedUntil = localStorage.getItem(getDismissKey());
        if (!dismissedUntil) return false;
        return Date.now() < parseInt(dismissedUntil, 10);
    };

    const [dismissed, setDismissed] = useState(isDismissedInStorage);

    const handleDismiss = () => {
        const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem(getDismissKey(), sevenDaysFromNow.toString());
        setDismissed(true);
    };

    if (!settings.importantMessage?.trim() || dismissed) {
        return null;
    }

    return (
        <div className="bg-warn/10 border-b border-warn/30 text-warn text-sm">
            <div className="max-w-page mx-auto px-6 py-2.5 flex items-start gap-3">
                <span className="font-mono text-xs pt-0.5">{t('important_alert.label')}</span>
                <div className="flex-1 min-w-0 prose prose-sm max-w-none text-warn prose-p:my-0 prose-p:text-warn prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-a:text-warn prose-a:underline prose-strong:text-warn">
                    <Markdown>{settings.importantMessage}</Markdown>
                </div>
                <button
                    type="button"
                    onClick={handleDismiss}
                    className="flex-none p-0.5 text-warn/70 hover:text-warn cursor-pointer"
                    aria-label={t('important_alert.dismiss')}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
