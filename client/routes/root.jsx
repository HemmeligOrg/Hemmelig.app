import { Outlet } from 'react-router-dom';
import { getSettings } from '../api/settings';
import useSettingsStore from '../stores/settingsStore';

export async function loader() {
    const { setSettings, setError, setLoading } = useSettingsStore.getState();

    try {
        setLoading(true);
        const settings = await getSettings();

        if (settings.error) {
            setError(settings.error);
        } else {
            setSettings(settings);
        }

        return null;
    } catch (error) {
        console.error('Failed to load settings:', error);
        setError('Failed to load application settings');
        return null;
    }
}

export default function Root() {
    const { isLoading, error } = useSettingsStore();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-200 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex items-center justify-center">
                <div className="text-center text-red-500">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            <Outlet />
        </div>
    );
}
