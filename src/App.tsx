import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import ErrorDisplay from './components/ErrorDisplay';
import { Toaster } from 'sonner';

function App() {
    return (
        <>
            <RouterProvider router={router} />
            <ErrorDisplay />
            <Toaster />
        </>
    );
}

export default App;
