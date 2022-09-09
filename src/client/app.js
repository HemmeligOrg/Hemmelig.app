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
import { ModalsProvider } from '@mantine/modals';
import { useTranslation } from 'react-i18next';

import HeaderContent from './components/header';

// Code-splitting is automated for `routes` directory
import Home from './routes/home';
import Secret from './routes/secret';
import Privacy from './routes/privacy';
import SignIn from './routes/signin';
import SignUp from './routes/signup';
import Account from './routes/account';
import Terms from './routes/terms';

const App = () => {
    const { t } = useTranslation();

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
                <ModalsProvider>
                    <AppShell
                        styles={{
                            main: {
                                background: theme.colors.dark[7],
                            },
                        }}
                        navbarOffsetBreakpoint="sm"
                        footer={
                            <Footer height={45} p="xs">
                                <Group position="center" spacing="xs">
                                    <Anchor
                                        component={Link}
                                        to="/signin"
                                        color="dimmed"
                                        size="xs"
                                        transform="uppercase"
                                    >
                                        {t('sign_in')}
                                    </Anchor>
                                    |
                                    <Anchor
                                        component={Link}
                                        to="/account"
                                        color="dimmed"
                                        size="xs"
                                        transform="uppercase"
                                    >
                                        {t('account')}
                                    </Anchor>
                                    |
                                    <Anchor
                                        component={Link}
                                        to="/privacy"
                                        color="dimmed"
                                        size="xs"
                                        transform="uppercase"
                                    >
                                        Privacy
                                    </Anchor>
                                    |
                                    <Anchor
                                        component={Link}
                                        to="/terms"
                                        color="dimmed"
                                        size="xs"
                                        transform="uppercase"
                                    >
                                        Terms & Condition
                                    </Anchor>
                                    |
                                    <Anchor
                                        component={Link}
                                        to="/"
                                        color="dimmed"
                                        size="xs"
                                        transform="uppercase"
                                    >
                                        About
                                    </Anchor>
                                    |
                                    <Anchor
                                        href="https://www.github.com/HemmeligOrg/hemmelig"
                                        color="dimmed"
                                        size="xs"
                                        transform="uppercase"
                                    >
                                        <Text size="xs">
                                            <span role="img" aria-label="a heart">
                                                ❤️
                                            </span>{' '}
                                            By Hemmelig
                                        </Text>
                                    </Anchor>
                                </Group>
                            </Footer>
                        }
                        header={
                            <Header height={75} p="xs">
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
                            <Route path="/terms" exact>
                                <Terms />
                            </Route>
                            <Route path="/">
                                <Home />
                            </Route>
                        </Switch>
                    </AppShell>
                </ModalsProvider>
            </MantineProvider>
        </Router>
    );
};

export default App;
