import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { useHemmeligStore } from '../store/hemmeligStore';

const DISMISS_KEY = 'importantAlertDismissedUntil';

export function ImportantAlert() {
    const { settings } = useHemmeligStore();

    const isDismissedInStorage = () => {
        const dismissedUntil = localStorage.getItem(DISMISS_KEY);
        if (!dismissedUntil) return false;
        return Date.now() < parseInt(dismissedUntil, 10);
    };

    const [dismissed, setDismissed] = useState(isDismissedInStorage);

    const handleDismiss = () => {
        const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem(DISMISS_KEY, sevenDaysFromNow.toString());
        setDismissed(true);
    };

    if (!settings.importantMessage || dismissed) {
        return null;
    }

    return (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 mb-4">
            <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-amber-800 dark:text-amber-200">
                    {settings.importantMessage}
                </div>
                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
                    aria-label="Dismiss"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
