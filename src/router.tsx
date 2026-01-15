import { createBrowserRouter, redirect } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { RootLayout } from './components/Layout/RootLayout';
import { trackPageView } from './lib/analytics';
import { api, apiRaw } from './lib/api';
import { authClient } from './lib/auth';
import { AccountPage } from './pages/Dashboard/AccountPage';
import { AnalyticsPage } from './pages/Dashboard/AnalyticsPage';
import { CreateSecretRequestPage } from './pages/Dashboard/CreateSecretRequestPage';
import { InstancePage } from './pages/Dashboard/InstancePage';
import { InvitesPage } from './pages/Dashboard/InvitesPage';
import { SecretRequestsPage } from './pages/Dashboard/SecretRequestsPage';
import { SecretsPage } from './pages/Dashboard/SecretsPage';
import { UsersPage } from './pages/Dashboard/UsersPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { RegisterPage } from './pages/RegisterPage';
import { RequestSecretPage } from './pages/RequestSecretPage';
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

            // Redirect to login if registered users only and not signed in
            const { settings } = useHemmeligStore.getState();
            if (settings.requireRegisteredUser && !user) {
                return redirect('/login');
            }

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
                path: '/request/:id',
                element: <RequestSecretPage />,
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
                loader: async ({ request }) => {
                    const url = new URL(request.url);
                    const page = url.searchParams.get('page') || '1';
                    const pageSize = url.searchParams.get('pageSize') || '10';
                    const search = url.searchParams.get('search') || '';

                    const emptyResponse = (error: string) => ({
                        error,
                        users: [],
                        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
                        search: '',
                    });

                    try {
                        const response = await api.user.$get({
                            query: { page, pageSize, search },
                        });

                        if (!response.ok) {
                            return emptyResponse("You don't have permission to view users.");
                        }

                        const data = await response.json();

                        return {
                            users: data.users,
                            error: null,
                            pagination: {
                                total: data.total,
                                page: data.page,
                                pageSize: data.pageSize,
                                totalPages: data.totalPages,
                            },
                            search,
                        };
                    } catch (error) {
                        console.error('Failed to fetch users:', error);
                        return emptyResponse('Failed to fetch users');
                    }
                },
            },
            {
                path: 'instance',
                element: <InstancePage />,
                loader: async () => {
                    try {
                        const [settingsRes, managedRes] = await Promise.all([
                            api.instance.settings.$get(),
                            apiRaw.instance.managed.$get(),
                        ]);
                        if (settingsRes.status === 403) {
                            return { error: "You don't have permission to view settings." };
                        }
                        const settings = await settingsRes.json();
                        const managedData = await managedRes.json();
                        return { ...settings, managed: managedData.managed ?? false };
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
            {
                path: 'secret-requests',
                element: <SecretRequestsPage />,
                loader: async () => {
                    try {
                        const res = await api['secret-requests'].$get();
                        if (res.ok) {
                            return await res.json();
                        }
                        return { data: [], meta: { total: 0, page: 1, totalPages: 0 } };
                    } catch (error) {
                        console.error('Failed to fetch secret requests:', error);
                        return { data: [], meta: { total: 0, page: 1, totalPages: 0 } };
                    }
                },
            },
            {
                path: 'secret-requests/create',
                element: <CreateSecretRequestPage />,
            },
        ],
    },
]);
