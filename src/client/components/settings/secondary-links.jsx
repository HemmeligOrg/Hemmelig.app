import { Box, Group, Text, ThemeIcon, UnstyledButton, rem, useMantineTheme } from '@mantine/core';
import { IconFingerprint, IconList, IconLockOff } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

function SecondaryLink({ icon, color, label, route }) {
    const navigate = useNavigate();

    return (
        <UnstyledButton
            sx={(theme) => ({
                display: 'block',
                width: '100%',
                padding: theme.spacing.xs,
                borderRadius: theme.radius.sm,
                color: theme.colors.dark[0],

                '&:hover': {
                    backgroundColor: theme.colors.dark[6],
                },
            })}
            onClick={() => navigate(route)}
        >
            <Group>
                <ThemeIcon color={color} variant="light">
                    {icon}
                </ThemeIcon>

                <Text size="sm">{label}</Text>
            </Group>
        </UnstyledButton>
    );
}

export default function SecondaryLinks() {
    const { t } = useTranslation();
    const theme = useMantineTheme();

    const data = [
        {
            label: t('public_list'),
            icon: <IconList size="1rem" stroke={1.5} />,
            route: '/public',
        },
        {
            label: 'Privacy',
            icon: <IconFingerprint size="1rem" stroke={1.5} />,
            route: '/account/privacy',
        },
        {
            label: 'Terms & Condition',
            icon: <IconList size="1rem" stroke={1.5} />,
            route: '/account/terms',
        },
        {
            icon: <IconLockOff size="1rem" stroke={1.5} />,
            color: 'red',
            label: t('sign_out'),
            route: '/signout',
        },
    ];

    const links = data.map((link) => <SecondaryLink {...link} key={link.label} />);

    return (
        <Box
            sx={{
                paddingTop: theme.spacing.sm,
                borderTop: `${rem(1)} solid ${theme.colors.dark[4]}`,
            }}
        >
            {links}
        </Box>
    );
}
