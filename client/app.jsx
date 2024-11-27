import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import createAppRouter from './routes.jsx';
import { loader } from './routes/root';
import useSettingsStore from './stores/settingsStore';

const HemmeligApplication = () => {
    const { isLoading } = useSettingsStore();
    const router = createAppRouter();

    useEffect(() => {
        loader();
    }, []);

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

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            <RouterProvider router={router} />
        </div>
    );
};

export default HemmeligApplication;
