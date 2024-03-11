import { Anchor, AppShell, Group, Header, Navbar, useMantineTheme } from '@mantine/core';
import { Link, Outlet } from 'react-router-dom';

import Logo from './components/header/logo';
import Nav from './components/header/nav';
import logoStyles from './components/header/style.module.css';
import MainLinks from './components/settings/main-links';
import SecondaryLinks from './components/settings/secondary-links';

const AdminShell = () => {
    const theme = useMantineTheme();

    return (
        <AppShell
            padding="md"
            fixed={false}
            navbar={
                <Navbar
                    width={{ base: 300 }}
                    height={500}
                    p="xs"
                    sx={(theme) => ({
                        backgroundColor: theme.colors.dark[8],
                    })}
                >
                    <Navbar.Section grow mt="xs">
                        <MainLinks />
                    </Navbar.Section>
                    <Navbar.Section grow mt="xs">
                        <SecondaryLinks />
                    </Navbar.Section>
                </Navbar>
            }
            header={
                <Header
                    height={75}
                    style={{ zIndex: 1100 }}
                    sx={(theme) => ({
                        backgroundColor: theme.colors.dark[8],
                    })}
                >
                    <Group sx={{ height: '100%', paddingTop: '5px' }} px={20} position="apart">
                        <Anchor component={Link} to="/">
                            <Logo className={logoStyles.logo} />
                        </Anchor>

                        <Nav />
                    </Group>
                </Header>
            }
            styles={{
                main: {
                    background: theme.colors.dark[8],
                },
            }}
        >
            <Outlet />
        </AppShell>
    );
};

export default AdminShell;
