import { h } from 'preact';
import { Router } from 'preact-router';

import Header from './header';
import Footer from './footer';

// Code-splitting is automated for `routes` directory
import Home from '../routes/home';
import Secret from '../routes/secret';
import Privacy from '../routes/privacy';
import SignIn from '../routes/signin';
import SignUp from '../routes/signup';
import Account from '../routes/account';
import ApiDocs from '../routes/api-docs';

const App = () => (
    <>
        <div id="app">
            <Header />
            <div id="app-inner">
                <Router>
                    <Home path="/" />
                    <Secret path="/secret/:secretId" />
                    <Secret path="/secret/:encryptionKey/:secretId" />
                    <SignIn path="/signin" />
                    <SignUp path="/signup" />
                    <Privacy path="/privacy" />
                    <Account path="/account" />
                    <ApiDocs path="/api-docs" />
                </Router>
            </div>
            <Footer />
        </div>
    </>
);

export default App;
