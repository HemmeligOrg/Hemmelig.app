import { Anchor, Container, Group, Stack, Table, Title } from '@mantine/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslation } from 'react-i18next';
import { Link, useLoaderData, useParams } from 'react-router-dom';

dayjs.extend(relativeTime);

const PublicSecrets = () => {
    const { t } = useTranslation();

    const secrets = useLoaderData();
    const { username = '' } = useParams();

    const getTime = (expiresAt) => {
        return dayjs().to(dayjs(expiresAt));
    };

    const rows = secrets.map((secret) => (
        <tr key={secret.id}>
            <td>
                <Anchor
                    color="gray"
                    component={Link}
                    to={`/secret/${secret.id}#encryption_key=public`}
                >
                    {(secret.title.length > 40
                        ? secret.title.slice(0, 40) + '...'
                        : secret.title) || secret.id}
                </Anchor>
            </td>
            <td>
                <Anchor
                    color="gray"
                    component={Link}
                    to={`/public/${secret.user?.username ?? 1337}`}
                >
                    {secret.user?.username ?? 'Anonymous'}
                </Anchor>
            </td>
            <td>{getTime(secret.expiresAt)}</td>
        </tr>
    ));

    return (
        <Container>
            <Stack>
                <Title order={1} size="h2" align="center">
                    {t('public.heading')} {username && `${t('public.of')} ${username}`}
                </Title>

                <Group position="left">
                    <Table horizontalSpacing="sm" highlightOnHover>
                        <thead>
                            <tr>
                                <th>{t('public.title')}</th>
                                <th>{t('public.expires')}</th>
                                <th>{t('public.username')}</th>
                            </tr>
                        </thead>
                        <tbody>{rows}</tbody>
                    </Table>
                </Group>
            </Stack>
        </Container>
    );
};

export default PublicSecrets;
