import { lazy, useEffect } from 'react';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
import AdminShell from './admin-shell.jsx';
import { trackPageView } from './api/analytics';
import ApplicationShell from './app-shell.jsx';
import config from './config';
import ApiDocs from './routes/api-docs/index.jsx';

const Home = lazy(() => import('./routes/home'));
const Secret = lazy(() => import('./routes/secret'));
const PublicSecrets = lazy(() => import('./routes/public'));
const Privacy = lazy(() => import('./routes/privacy'));
const SignIn = lazy(() => import('./routes/signin'));
const SignUp = lazy(() => import('./routes/signup'));
const SignOut = lazy(() => import('./routes/signout'));
const Account = lazy(() => import('./routes/account'));
const Terms = lazy(() => import('./routes/terms'));
const Secrets = lazy(() => import('./routes/account/secrets'));
const Settings = lazy(() => import('./routes/account/settings'));
const Users = lazy(() => import('./routes/account/users'));
const UserAccount = lazy(() => import('./routes/account/account'));
const Analytics = lazy(() => import('./routes/account/analytics'));
const NotFound = lazy(() => import('./routes/not-found'));

const createAppRouter = () => {
    useEffect(() => {
        if (config.get('settings.analytics.enabled')) {
            trackPageView(location.pathname);
        }
    }, [location.pathname]);

    return createBrowserRouter(
        createRoutesFromElements(
            <>
                <Route path="/" element={<ApplicationShell />}>
                    <Route index element={<Home />} />
                    <Route path="secret/:encryptionKey/:secretId" element={<Secret />} />
                    <Route path="secret/:secretId" element={<Secret />} />
                    <Route
                        element={<PublicSecrets />}
                        path="public"
                        loader={async () => {
                            const { getPublicSecrets } = await import('./api/secret');
                            return await getPublicSecrets();
                        }}
                    />
                    <Route
                        element={<PublicSecrets />}
                        path="public/:username"
                        loader={async ({ params }) => {
                            const { getPublicSecrets } = await import('./api/secret');
                            return await getPublicSecrets(params?.username);
                        }}
                    />
                    <Route path="signin" element={<SignIn />} />
                    <Route path="signup" element={<SignUp />} />
                    <Route path="signout" element={<SignOut />} />
                    <Route path="privacy" element={<Privacy />} />
                    <Route path="terms" element={<Terms />} />
                </Route>
                <Route path="/account" element={<AdminShell />}>
                    <Route
                        index
                        element={<Account />}
                        loader={async () => {
                            const { getUser } = await import('./api/account');
                            return await getUser();
                        }}
                    />
                    <Route
                        path="account"
                        element={<Account />}
                        loader={async () => {
                            const { getUser } = await import('./api/account');
                            return await getUser();
                        }}
                    />
                    <Route
                        path="secrets"
                        element={<Secrets />}
                        loader={async () => {
                            const { getSecrets } = await import('./api/secret');
                            return await getSecrets();
                        }}
                    />
                    <Route
                        path="instance-settings"
                        element={<Settings />}
                        loader={async () => {
                            const { getSettings } = await import('./api/settings');
                            return await getSettings();
                        }}
                    />
                    <Route
                        path="account-settings"
                        element={<UserAccount />}
                        loader={async () => {
                            const { getUser } = await import('./api/account');
                            return await getUser();
                        }}
                    />
                    <Route
                        path="users"
                        element={<Users />}
                        loader={async () => {
                            const { getUsers } = await import('./api/users');
                            return await getUsers();
                        }}
                    />
                    <Route
                        path="analytics"
                        element={<Analytics />}
                        loader={async () => {
                            const { getAnalyticsData, getStatistics } = await import(
                                './api/analytics'
                            );

                            return await Promise.all([getAnalyticsData(), getStatistics()]);
                        }}
                    />
                    <Route path="privacy" element={<Privacy />} />
                    <Route path="terms" element={<Terms />} />
                </Route>
                <Route path="404" element={<NotFound />} />
                <Route path="/api-docs" element={<ApiDocs />} />
            </>
        )
    );
};

export default createAppRouter;
