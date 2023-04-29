import { lazy } from 'react';
import { Routes, Route, useRoutes } from 'react-router-dom';
import ApplicationShell from './app-shell.jsx';
import AdminShell from './admin-shell.jsx';

const Home = lazy(() => import('./routes/home'));
const Secret = lazy(() => import('./routes/secret'));
const Privacy = lazy(() => import('./routes/privacy'));
const SignIn = lazy(() => import('./routes/signin'));
const SignUp = lazy(() => import('./routes/signup'));
const SignOut = lazy(() => import('./routes/signout'));
const Account = lazy(() => import('./routes/account'));
const Terms = lazy(() => import('./routes/terms'));

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<ApplicationShell />}>
                <Route index element={<Home />} />
                <Route path="secret/:encryptionKey/:secretId" element={<Secret />} />
                <Route path="signin" element={<SignIn />} />
                <Route path="signup" element={<SignUp />} />
                <Route path="signout" element={<SignOut />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="terms" element={<Terms />} />
            </Route>

            <Route path="/account" element={<AdminShell />}>
                <Route index element={<Account />} />
                <Route path=":tabValue" element={<Account />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
