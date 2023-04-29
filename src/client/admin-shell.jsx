import { Outlet } from 'react-router-dom';
import {
    AppShell,
    Navbar,
    Header,
    Group,
    ActionIcon,
    useMantineColorScheme,
    useMantineTheme,
} from '@mantine/core';

import MainLinks from './components/settings/main-links';
import Nav from './components/header/nav';
import Logo from './components/header/logo';
import logoStyles from './components/header/style.module.css';

const AdminShell = () => {
    const theme = useMantineTheme();

    return (
        <AppShell
            padding="md"
            fixed={false}
            navbar={
                <Navbar width={{ base: 300 }} height={500} p="xs">
                    <Navbar.Section grow mt="xs">
                        <MainLinks />
                    </Navbar.Section>
                </Navbar>
            }
            header={
                <Header height={60}>
                    <Group sx={{ height: '100%' }} px={20} position="apart">
                        <Logo className={logoStyles.logo} />
                        <Nav />
                    </Group>
                </Header>
            }
            styles={{
                main: {
                    background: theme.colors.dark[7],
                },
            }}
        >
            <Outlet />
        </AppShell>
    );
};

export default AdminShell;
