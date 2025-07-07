import { createBrowserRouter, redirect } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { SecretPage } from './pages/SecretPage';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { SecretsPage } from './pages/Dashboard/SecretsPage';
import { AccountPage } from './pages/Dashboard/AccountPage';
import { AnalyticsPage } from './pages/Dashboard/AnalyticsPage';
import { UsersPage } from './pages/Dashboard/UsersPage';
import { InstancePage } from './pages/Dashboard/InstancePage';
import { api } from './lib/api';
import { useHemmeligStore } from './store/hemmeligStore';
import { RootLayout } from './components/Layout/RootLayout';

export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        loader: async () => {
            try {
                const res = await api.instance.settings.$get();
                if (!res.ok) {
                    console.error('Failed to fetch instance settings');
                    return null;
                }
                const settings = await res.json();
                useHemmeligStore.getState().setSettings(settings);
                return settings;
            } catch (error) {
                console.error('Error fetching instance settings:', error);
                return null;
            }
        },
        children: [
            {
                path: '/',
                element: <HomePage />,
            },
            {
                path: '/login',
                element: <LoginPage />,
            },
            {
                path: '/register',
                element: <RegisterPage />,
                loader: () => {
                    const { settings } = useHemmeligStore.getState();
                    if (!settings.allowRegistration) {
                        return redirect('/login');
                    }
                    return null;
                },
            },
            {
                path: '/forgot-password',
                element: <ForgotPasswordPage />,
            },
            {
                path: '/secret/:id',
                element: <SecretPage />,
                loader: async ({ params }) => {
                    if (!params.id) {
                        throw new Response('Not Found', { status: 404 });
                    }
                    const res = await api.secrets[':id'].check.$get({ param: { id: params.id } });
                    return res.json();
                },
            },
        ]
    },
    {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
            {
                index: true,
                element: <SecretsPage />,
                loader: async () => {
                    const res = await api.secrets.$get();
                    return await res.json();
                },
            },
            {
                path: 'account',
                element: <AccountPage />,
                loader: async () => {
                    try {
                        const res = await api.account.$get();
                        if (res.status === 401) {
                            return redirect('/login');
                        }
                        return res.json();
                    } catch {
                        return redirect('/login');
                    }
                }
            },
            {
                path: 'analytics',
                element: <AnalyticsPage />,
            },
            {
                path: 'users',
                element: <UsersPage />,
            },
            {
                path: 'instance',
                element: <InstancePage />,
            },
        ]
    }
]);
