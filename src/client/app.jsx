import React, { lazy } from 'react';
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

const HeaderContent = lazy(() => import('./components/header'));

const Home = lazy(() => import('./routes/home'));
const Secret = lazy(() => import('./routes/secret'));
const Privacy = lazy(() => import('./routes/privacy'));
const SignIn = lazy(() => import('./routes/signin'));
const SignUp = lazy(() => import('./routes/signup'));
const Account = lazy(() => import('./routes/account'));
const Terms = lazy(() => import('./routes/terms'));

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
                        hemmelig: [
                            '#ffffff',
                            '#eaf5f4',
                            '#d4ebe9',
                            '#bfe2dd',
                            '#aad8d2',
                            '#95cec7',
                            '#7fc4bc',
                            '#6abab1',
                            '#55b1a5',
                            '#3fa79a',
                            '#2a9d8f',
                        ],
                        'hemmelig-orange': [
                            '#ffffff',
                            '#fff5f0',
                            '#ffeae1',
                            '#ffe0d2',
                            '#ffd5c3',
                            '#ffcbb4',
                            '#ffc1a5',
                            '#ffb696',
                            '#ffac87',
                            '#ffa178',
                            '#ff9769',
                        ],
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
                                    <>
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
                                    </>
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
                                        href="https://github.com/HemmeligOrg/Hemmelig.app"
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
                            <Route path="/secret/:secretId" exact>
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
