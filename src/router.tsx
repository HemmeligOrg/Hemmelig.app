import { createBrowserRouter, redirect } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { RootLayout } from './components/Layout/RootLayout';
import { trackPageView } from './lib/analytics';
import { api } from './lib/api';
import { authClient } from './lib/auth';
import { AccountPage } from './pages/Dashboard/AccountPage';
import { AnalyticsPage } from './pages/Dashboard/AnalyticsPage';
import { InstancePage } from './pages/Dashboard/InstancePage';
import { InvitesPage } from './pages/Dashboard/InvitesPage';
import { SecretsPage } from './pages/Dashboard/SecretsPage';
import { UsersPage } from './pages/Dashboard/UsersPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { RegisterPage } from './pages/RegisterPage';
import { SecretNotFoundPage } from './pages/SecretNotFoundPage';
import { SecretPage } from './pages/SecretPage';
import { SetupPage } from './pages/SetupPage';
import { TermsPage } from './pages/TermsPage';
import { Verify2FAPage } from './pages/Verify2FAPage';
import { useHemmeligStore } from './store/hemmeligStore';
import { useUserStore } from './store/userStore';

// Check if initial setup is needed
const checkSetupStatus = async () => {
    try {
        const res = await api.setup.status.$get();
        if (res.ok) {
            const data = await res.json();
            return data.needsSetup;
        }
    } catch (error) {
        console.error('Failed to check setup status:', error);
    }
    return false;
};

// Loader to fetch instance settings
const instanceSettingsLoader = async () => {
    // Check if setup is needed first
    const needsSetup = await checkSetupStatus();
    if (needsSetup) {
        return redirect('/setup');
    }

    try {
        const res = await api.instance.settings.public.$get();
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
};

// Loader to fetch user session and update store
const userSessionLoader = async () => {
    const { data, error } = await authClient.getSession();
    const user = data?.user ?? null;
    useUserStore.getState().setUser(user);
    return { user, error };
};

// Combined loader for dashboard layout
const dashboardLoader = async () => {
    const { data, error } = await authClient.getSession();
    if (!data?.user) {
        return redirect('/login');
    }
    useUserStore.getState().setUser(data.user);
    return { user: data.user, error };
};

export const router = createBrowserRouter([
    // Setup page - only accessible when no users exist
    {
        path: '/setup',
        element: <SetupPage />,
        errorElement: <ErrorBoundary />,
        loader: async () => {
            const needsSetup = await checkSetupStatus();
            if (!needsSetup) {
                return redirect('/');
            }
            return null;
        },
    },
    // Auth pages without header/footer
    {
        path: '/login',
        element: <LoginPage />,
        errorElement: <ErrorBoundary />,
        loader: instanceSettingsLoader,
    },
    {
        path: '/register',
        element: <RegisterPage />,
        errorElement: <ErrorBoundary />,
        loader: async () => {
            await instanceSettingsLoader();
            const { settings } = useHemmeligStore.getState();
            if (!settings.allowRegistration) {
                return redirect('/login');
            }
            return null;
        },
    },
    {
        path: '/verify-2fa',
        element: <Verify2FAPage />,
        errorElement: <ErrorBoundary />,
        loader: instanceSettingsLoader,
    },
    // Pages with header/footer
    {
        element: <RootLayout />,
        errorElement: <ErrorBoundary />,
        loader: async () => {
            // First check setup status
            const needsSetup = await checkSetupStatus();
            if (needsSetup) {
                return redirect('/setup');
            }

            // Fetch instance settings
            try {
                const res = await api.instance.settings.public.$get();
                if (res.ok) {
                    const settings = await res.json();
                    useHemmeligStore.getState().setSettings(settings);
                }
            } catch (error) {
                console.error('Error fetching instance settings:', error);
            }

            // Fetch user session
            const { data } = await authClient.getSession();
            const user = data?.user ?? null;
            useUserStore.getState().setUser(user);

            return { user };
        },
        children: [
            {
                path: '/',
                element: <HomePage />,
                loader: async () => {
                    trackPageView('/');
                    return null;
                },
            },
            {
                path: '/secret/:id',
                element: <SecretPage />,
                errorElement: <SecretNotFoundPage />,
                loader: async ({ params }) => {
                    if (!params.id) {
                        throw new Response('Not Found', { status: 404 });
                    }
                    trackPageView('/secret');
                    const res = await api.secrets[':id'].check.$get({ param: { id: params.id } });
                    return res.json();
                },
            },
            {
                path: '/terms',
                element: <TermsPage />,
            },
            {
                path: '/privacy',
                element: <PrivacyPage />,
            },
            {
                path: '*',
                element: <NotFoundPage />,
            },
        ],
    },
    {
        path: '/dashboard',
        element: <DashboardLayout />,
        errorElement: <ErrorBoundary />,
        loader: dashboardLoader,
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
                        const accountData = await res.json();
                        // Get 2FA status from the user store (already loaded by dashboardLoader)
                        const user = useUserStore.getState().user;
                        return {
                            ...accountData,
                            twoFactorEnabled: user?.twoFactorEnabled || false,
                        };
                    } catch {
                        return redirect('/login');
                    }
                },
            },
            {
                path: 'analytics',
                element: <AnalyticsPage />,
                loader: async () => {
                    try {
                        // Fetch both analytics and visitor stats in parallel
                        const [analyticsRes, visitorsRes] = await Promise.all([
                            api.analytics.$get({ query: { timeRange: '30d' } }),
                            api.analytics.visitors.daily.$get({ query: { timeRange: '30d' } }),
                        ]);

                        if (analyticsRes.status === 403) {
                            return { error: "You don't have permission to view analytics." };
                        }
                        if (!analyticsRes.ok) {
                            return { error: 'Failed to fetch analytics data.' };
                        }

                        const analytics = await analyticsRes.json();
                        const visitors = visitorsRes.ok ? await visitorsRes.json() : [];

                        return { ...analytics, visitorStats: visitors };
                    } catch (error) {
                        console.error('Failed to fetch analytics data:', error);
                        return { error: 'Failed to fetch analytics data.' };
                    }
                },
            },
            {
                path: 'users',
                element: <UsersPage />,
                loader: async () => {
                    try {
                        const response = await authClient.admin.listUsers();
                        if (response.status === 403) {
                            return { error: "You don't have permission to view users.", users: [] };
                        }
                        return { users: response?.data?.users || [], error: null };
                    } catch (error) {
                        console.error('Failed to fetch users:', error);
                        return { error: 'Failed to fetch users', users: [] };
                    }
                },
            },
            {
                path: 'instance',
                element: <InstancePage />,
                loader: async () => {
                    try {
                        const res = await api.instance.settings.$get();
                        if (res.status === 403) {
                            return { error: "You don't have permission to view settings." };
                        }
                        return await res.json();
                    } catch (error) {
                        console.error('Failed to fetch instance settings:', error);
                        return { error: 'Failed to fetch settings.' };
                    }
                },
            },
            {
                path: 'invites',
                element: <InvitesPage />,
                loader: async () => {
                    try {
                        const res = await api.invites.$get();
                        if (res.ok) {
                            return await res.json();
                        }
                        return [];
                    } catch (error) {
                        console.error('Failed to fetch invites:', error);
                        return [];
                    }
                },
            },
        ],
    },
]);
