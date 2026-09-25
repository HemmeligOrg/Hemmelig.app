import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorDisplay from './components/ErrorDisplay';
import { router } from './router';
import { resolveTheme, useThemeStore } from './store/themeStore';

function App() {
    const { theme, hasUserChoice, defaultTheme, setTheme } = useThemeStore();

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // With the "system" default and no choice of the visitor, follow changes
    // of the operating system theme.
    useEffect(() => {
        if (hasUserChoice || defaultTheme !== 'system' || !window.matchMedia) {
            return;
        }
        const query = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => setTheme(resolveTheme('system'));
        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
    }, [hasUserChoice, defaultTheme, setTheme]);

    return (
        <>
            <RouterProvider router={router} />
            <ErrorDisplay />
            <Toaster />
        </>
    );
}

export default App;
