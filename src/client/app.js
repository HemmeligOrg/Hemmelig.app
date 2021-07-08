import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Header from './components/header';
import Footer from './/components/footer';

// Code-splitting is automated for `routes` directory
import Home from './routes/home';
import Secret from './routes/secret';
import Privacy from './routes/privacy';
import SignIn from './routes/signin';
import SignUp from './routes/signup';
import Account from './routes/account';
import ApiDocs from './routes/api-docs';

const App = () => (
    <Router>
        <div id="app">
            <Header />
            <div id="app-inner">
                <Switch>
                    <Route path="/secret/:encryptionKey/:secretId" exact>
                        <Secret />
                    </Route>
                    <Route path="/signin" exact>
                        <SignIn />
                    </Route>
                    <Route path="/signup" exact>
                        <SignUp />
                    </Route>
                    <Route path="/privacy" exact>
                        <Privacy />
                    </Route>
                    <Route path="/account" exact>
                        <Account />
                    </Route>
                    <Route path="/api-docs" exact>
                        <ApiDocs />
                    </Route>
                    <Route path="/">
                        <Home />
                    </Route>
                </Switch>
            </div>
            <Footer />
        </div>
    </Router>
);

export default App;
