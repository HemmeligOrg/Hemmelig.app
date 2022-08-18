import React from 'react';
import { Link, BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import {
    MantineProvider,
    AppShell,
    Anchor,
    Header,
    Footer,
    Text,
    useMantineTheme,
    Group,
} from '@mantine/core';

import HeaderContent from './components/header';

// Code-splitting is automated for `routes` directory
import Home from './routes/home';
import Secret from './routes/secret';
import Privacy from './routes/privacy';
import SignIn from './routes/signin';
import SignUp from './routes/signup';
import Account from './routes/account';
import ApiDocs from './routes/api-docs';

const App = () => {
    const theme = useMantineTheme();

    return (
        <Router>
            <MantineProvider
                withGlobalStyles
                withNormalizeCSS
                theme={{
                    colorScheme: 'dark',
                    colors: {
                        hemmelig: ['#2a9d8f'],
                    },
                    fontFamily: 'Inter, sans-serif',
                    fontFamilyMonospace: 'Inter, sans-serif',
                    headings: { fontFamily: 'Inter, sans-serif' },
                }}
            >
                <AppShell
                    styles={{
                        main: {
                            background: theme.colors.dark[7],
                        },
                    }}
                    navbarOffsetBreakpoint="sm"
                    footer={
                        <Footer height={60} p="md">
                            <Group position="center">
                                <Anchor component={Link} to="/signin" color="dimmed">
                                    <Text size="xs">SIGN IN</Text>
                                </Anchor>
                                |
                                <Anchor component={Link} to="/account" color="dimmed">
                                    <Text size="xs">ACCOUNT</Text>
                                </Anchor>
                                |
                                <Anchor component={Link} to="/privacy" color="dimmed">
                                    <Text size="xs">PRIVACY</Text>
                                </Anchor>
                                |
                                <Anchor component={Link} to="/api-docs" color="dimmed">
                                    <Text size="xs">API</Text>
                                </Anchor>
                                |
                                <Anchor component={Link} to="/" color="dimmed">
                                    <Text size="xs">ABOUT</Text>
                                </Anchor>
                                |
                                <Anchor
                                    href="https://www.github.com/HemmeligOrg/hemmelig"
                                    color="dimmed"
                                >
                                    <Text size="xs">
                                        <span role="img" aria-label="a heart">
                                            ❤️
                                        </span>{' '}
                                        BY HEMMELIG
                                    </Text>
                                </Anchor>
                            </Group>
                        </Footer>
                    }
                    header={
                        <Header height={85} p="md">
                            <HeaderContent />
                        </Header>
                    }
                >
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
                </AppShell>
            </MantineProvider>
        </Router>
    );
};

export default App;
