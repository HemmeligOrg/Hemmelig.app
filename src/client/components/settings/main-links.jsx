import { IconUser, IconLock, IconSettings } from '@tabler/icons';
import { ThemeIcon, UnstyledButton, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

function MainLink({ icon, color, label, route }) {
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
            onClick={() => navigate(`/account/${route}`)}
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

export default function MainLinks() {
    const { t } = useTranslation();

    const data = [
        { icon: <IconUser size="1rem" />, color: 'blue', label: t('account'), route: 'account' },
        {
            icon: <IconLock size="1rem" />,
            color: 'teal',
            label: t('secrets.secrets'),
            route: 'secrets',
        },
        {
            icon: <IconSettings size="1rem" />,
            color: 'violet',
            label: t('instance_settings'),
            route: 'instance-settings',
        },
        {
            icon: <IconUser size="1rem" />,
            color: 'grape',
            label: t('account_settings'),
            route: 'account-settings',
        },
        {
            icon: <IconUser size="1rem" />,
            color: 'grape',
            label: t('users.users'),
            route: 'users',
        },
    ];

    const links = data.map((link) => <MainLink {...link} key={link.label} />);

    return <div>{links}</div>;
}
