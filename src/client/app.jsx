import { lazy } from 'react';
import { Link, BrowserRouter, Route, Routes } from 'react-router-dom';
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
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

const HeaderContent = lazy(() => import('./components/header'));

const Home = lazy(() => import('./routes/home'));
const Secret = lazy(() => import('./routes/secret'));
const Privacy = lazy(() => import('./routes/privacy'));
const SignIn = lazy(() => import('./routes/signin'));
const SignUp = lazy(() => import('./routes/signup'));
const SignOut = lazy(() => import('./routes/signout.jsx'));
const Account = lazy(() => import('./routes/account'));
const Terms = lazy(() => import('./routes/terms'));

const App = () => {
    const { t } = useTranslation();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const theme = useMantineTheme();

    return (
        <BrowserRouter>
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
                                    {!isMobile && (
                                        <>
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
                                        </>
                                    )}
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
                        <Routes>
                            <Route path="/secret/:encryptionKey/:secretId" element={<Secret />} />
                            <Route path="/secret/:secretId" element={<Secret />} />

                            <Route path="/signin" element={<SignIn />} />

                            <Route path="/signup" element={<SignUp />} />

                            <Route path="/signout" element={<SignOut />} />

                            <Route path="/privacy" element={<Privacy />} />

                            <Route path="/account" element={<Account />} />

                            <Route path="/account/:tabValue" element={<Account />} />

                            <Route path="/terms" element={<Terms />} />

                            <Route path="/" element={<Home />} />
                        </Routes>
                    </AppShell>
                </ModalsProvider>
            </MantineProvider>
        </BrowserRouter>
    );
};

export default App;
