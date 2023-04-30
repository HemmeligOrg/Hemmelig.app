import { Link, Outlet } from 'react-router-dom';
import { AppShell, Anchor, Header, Footer, Text, useMantineTheme, Group } from '@mantine/core';

import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

import HeaderContent from './components/header';

const ApplicationShell = () => {
    const { t } = useTranslation();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const theme = useMantineTheme();

    return (
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
            <Outlet />
        </AppShell>
    );
};

export default ApplicationShell;
