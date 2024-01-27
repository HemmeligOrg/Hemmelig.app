import { Anchor, Container, Group, Loader, Stack, Table, Title } from '@mantine/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { getPublicSecrets } from '../../api/secret';

dayjs.extend(relativeTime);

const PublicSecrets = () => {
    const { t } = useTranslation();

    const [secrets, setPublicSecrets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const secrets = await getPublicSecrets();

            setPublicSecrets(secrets);

            setIsLoading(false);
        })();
    }, []);

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
            <td>{getTime(secret.expiresAt)}</td>
        </tr>
    ));

    if (isLoading) {
        return (
            <Container>
                <Loader color="teal" variant="bars" />
            </Container>
        );
    }

    return (
        <Container>
            <Stack>
                <Title order={1} size="h2" align="center">
                    {t('public.heading')}
                </Title>

                <Group position="left">
                    <Table horizontalSpacing="sm" highlightOnHover>
                        <thead>
                            <tr>
                                <th>{t('public.title')}</th>
                                <th>{t('public.expires')}</th>
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
