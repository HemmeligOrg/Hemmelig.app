import { h } from 'preact';
import { Router } from 'preact-router';

import Header from './header';
import Footer from './footer';

// Code-splitting is automated for `routes` directory
import Home from '../routes/home';
import Secret from '../routes/secret';
import Privacy from '../routes/privacy';
import SignIn from '../routes/signin';

const App = () => (
    <>
        <div id="app">
            <Header />
            <Router>
                <Home path="/" />
                <Secret path="/secret/:secretId" />
                <SignIn path="/signin" />
                <Privacy path="/privacy" />
            </Router>
            <Footer />
        </div>
    </>
);

export default App;
