import { Info, X } from 'lucide-react';
import { useState } from 'react';
import Markdown from 'react-markdown';
import { hashString } from '../lib/hash';
import { useHemmeligStore } from '../store/hemmeligStore';

const DISMISS_KEY_PREFIX = 'importantAlertDismissed_';

export function ImportantAlert() {
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

    if (!settings.importantMessage || dismissed) {
        return null;
    }

    return (
        <div className="bg-gray-50 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-600 p-4 mb-4">
            <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-teal-500 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-gray-700 dark:text-slate-300 prose prose-sm dark:prose-invert prose-p:my-0 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-a:text-teal-600 dark:prose-a:text-teal-400 max-w-none">
                    <Markdown>{settings.importantMessage}</Markdown>
                </div>
                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                    aria-label="Dismiss"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
