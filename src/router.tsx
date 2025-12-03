import { createBrowserRouter, redirect } from 'react-router-dom';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { RootLayout } from './components/Layout/RootLayout';
import { api } from './lib/api';
import { AccountPage } from './pages/Dashboard/AccountPage';
import { AnalyticsPage } from './pages/Dashboard/AnalyticsPage';
import { InstancePage } from './pages/Dashboard/InstancePage';
import { InvitesPage } from './pages/Dashboard/InvitesPage';
import { SecretsPage } from './pages/Dashboard/SecretsPage';
import { UsersPage } from './pages/Dashboard/UsersPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SecretNotFoundPage } from './pages/SecretNotFoundPage';
import { SecretPage } from './pages/SecretPage';
import { SetupPage } from './pages/SetupPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { useHemmeligStore } from './store/hemmeligStore';

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
};

export const router = createBrowserRouter([
  // Setup page - only accessible when no users exist
  {
    path: '/setup',
    element: <SetupPage />,
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
    loader: instanceSettingsLoader,
  },
  {
    path: '/register',
    element: <RegisterPage />,
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
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
    loader: instanceSettingsLoader,
  },
  // Pages with header/footer
  {
    element: <RootLayout />,
    loader: instanceSettingsLoader,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/secret/:id',
        element: <SecretPage />,
        errorElement: <SecretNotFoundPage />,
        loader: async ({ params }) => {
          if (!params.id) {
            throw new Response('Not Found', { status: 404 });
          }
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
    ],
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
        },
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
        loader: async () => {
          try {
            const res = await api.analytics.$get({ query: { timeRange: '30d' } });
            if (res.status === 403) {
              return { error: "You don't have permission to view analytics." };
            }
            if (!res.ok) {
              return { error: 'Failed to fetch analytics data.' };
            }
            return await res.json();
          } catch (error) {
            console.error('Failed to fetch analytics data:', error);
            return { error: 'Failed to fetch analytics data.' };
          }
        },
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'instance',
        element: <InstancePage />,
      },
      {
        path: 'invites',
        element: <InvitesPage />,
      },
    ],
  },
]);
