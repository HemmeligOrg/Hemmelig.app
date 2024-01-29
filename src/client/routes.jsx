import { lazy } from 'react';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
import AdminShell from './admin-shell.jsx';
import ApplicationShell from './app-shell.jsx';

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

// loader: https://reactrouter.com/en/main/route/loader
const appRouter = createBrowserRouter(
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
                <Route index element={<Account />} />
                <Route path="account" element={<Account />} />
                <Route path="secrets" element={<Secrets />} />
                <Route path="instance-settings" element={<Settings />} />
                <Route path="account-settings" element={<UserAccount />} />
                <Route path="users" element={<Users />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="terms" element={<Terms />} />
            </Route>
        </>
    )
);

export default appRouter;
