import { Container, Loader, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import ErrorBox from '../../components/error-box';

import { useTranslation } from 'react-i18next';
import { getUser } from '../../api/account';

const HomeAccount = () => {
    const { t } = useTranslation();

    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const userInfo = await getUser();

                if (userInfo.error || [401, 500].includes(userInfo.statusCode)) {
                    setError(userInfo.error ? userInfo.error : t('not_logged_in'));

                    return;
                }

                setUser(userInfo.user);

                setIsLoading(false);
                setError(null);
            } catch (err) {
                setError(err);
            }
        })();
    }, []);

    if (!user?.username && !isLoading) {
        return <Navigate replace to="/signin" />;
    }

    if (!user?.username && !error) {
        return (
            <Container>
                <Loader color="teal" variant="bars" />
            </Container>
        );
    }

    if (error) {
        return (
            <Stack>
                <ErrorBox message={error} />
            </Stack>
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
