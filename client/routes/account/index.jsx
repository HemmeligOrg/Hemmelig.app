import { Container, Loader, Stack, Text } from '@mantine/core';
import { Navigate, useLoaderData } from 'react-router-dom';
import ErrorBox from '../../components/error-box';

import { useTranslation } from 'react-i18next';

const HomeAccount = () => {
    const { t } = useTranslation();

    const userInfo = useLoaderData();

    if (userInfo?.error || [401, 500].includes(userInfo.statusCode)) {
        return (
            <Stack>
                <ErrorBox message={userInfo.error ? userInfo.error : t('not_logged_in')} />
            </Stack>
        );
    }

    const { user = {} } = userInfo;

    if (!user?.username) {
        return <Navigate replace to="/signin" />;
    }

    if (!user?.username && !error) {
        return (
            <Container>
                <Loader color="teal" variant="bars" />
            </Container>
        );
    }

    return (
        <Stack>
            {user?.generated && (
                <ErrorBox
                    message={t('account.home.first_time_message')}
                    title={t('account.home.update_password')}
                />
            )}

            <Text size="sm">
                {t('account.home.hi')}, <strong>{user.username}</strong>
            </Text>

            <Text size="sm">
                {t('account.home.intro')}:
                <ul>
                    <li>{t('account.home.upload_files')}</li>
                    <li>{t('account.home.expiration')}</li>
                    <li>{t('account.home.secrets')}</li>
                </ul>
                {t('account.home.more')}
                <span role="img" aria-label="celebration icon">
                    🎉 🎉 🎉 🎉
                </span>
            </Text>
        </Stack>
    );
};

export default HomeAccount;
