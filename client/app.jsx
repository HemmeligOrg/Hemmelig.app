import { RouterProvider } from 'react-router-dom';
import appRouter from './routes.jsx';

const HemmeligApplication = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            <RouterProvider router={appRouter} />
        </div>
    );
};

export default HemmeligApplication;
