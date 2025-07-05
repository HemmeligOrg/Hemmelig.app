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

export const router = createBrowserRouter([
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
    {
        path: '/dashboard',
        element: <DashboardLayout><SecretsPage /></DashboardLayout>,
        loader: async () => {
            const res = await api.secrets.$get();
            return await res.json();
        },
    },
    {
        path: '/dashboard/account',
        element: <DashboardLayout><AccountPage /></DashboardLayout>,
        loader: async () => {
            try {
                const res = await api.account.$get();
                if (res.status === 401) {
                    return redirect('/login');
                }
                return res.json();
            } catch (error) {
                return redirect('/login');
            }
        }
    },
    {
        path: '/dashboard/analytics',
        element: <DashboardLayout><AnalyticsPage /></DashboardLayout>,
    },
    {
        path: '/dashboard/users',
        element: <DashboardLayout><UsersPage /></DashboardLayout>,
    },
    {
        path: '/dashboard/instance',
        element: <DashboardLayout><InstancePage /></DashboardLayout>,
    },
]);
