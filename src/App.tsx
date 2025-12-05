import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorDisplay from './components/ErrorDisplay';
import { router } from './router';
import { useThemeStore } from './store/themeStore';

function App() {
    const { theme } = useThemeStore();

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    return (
        <>
            <RouterProvider router={router} />
            <ErrorDisplay />
            <Toaster />
        </>
    );
}

export default App;
