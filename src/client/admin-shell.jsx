import { Outlet } from 'react-router-dom';
import { AppShell, Title, useMantineTheme } from '@mantine/core';

const AdminShell = () => {
    const theme = useMantineTheme();

    return (
        <AppShell
            styles={{
                main: {
                    background: theme.colors.dark[7],
                },
            }}
            navbarOffsetBreakpoint="sm"
            header={
                <Title order={5} style={{ textAlign: 'center' }}>
                    Header
                </Title>
            }
            footer={
                <Title order={5} style={{ textAlign: 'center' }}>
                    Footer
                </Title>
            }
        >
            <Outlet />
        </AppShell>
    );
};

export default AdminShell;
