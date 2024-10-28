import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './hooks/use-theme';
import appRouter from './routes.jsx';

const HemmeligApplication = () => {
    return (
        <ThemeProvider>
            <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
                <RouterProvider router={appRouter} />
            </div>
        </ThemeProvider>
    );
};

export default HemmeligApplication;
