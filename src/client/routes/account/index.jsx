import { useEffect, useState } from 'react';
import { Alert, Container, Loader, Text, Stack } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons';
import { Navigate } from 'react-router-dom';

import { getUser } from '../../api/account';
import { useTranslation } from 'react-i18next';

const HomeAccount = () => {
    const { t } = useTranslation();

    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const response = await getUser();

                if (response.statusCode === 401 || response.statusCode === 500) {
                    setError('Not logged in');

                    return;
                }

                setUser(response.user);

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

    if (!user?.username) {
        return (
            <Container>
                <Loader color="teal" variant="bars" />
            </Container>
        );
    }

    return (
        <>
            <Stack>
                {error && (
                    <Alert
                        icon={<IconAlertCircle size="1rem" />}
                        title={t('home.bummer')}
                        color="red"
                        variant="outline"
                    >
                        {error}
                    </Alert>
                )}

                {user?.generated && (
                    <Alert
                        icon={<IconAlertCircle size="1rem" />}
                        title="Update your password"
                        color="red"
                        variant="outline"
                    >
                        If this is the first time you sign in on this user account, you should go to
                        Account settings and update your password.
                    </Alert>
                )}
            </Stack>

            <Stack>
                <Text size="sm">
                    Hi, <strong>{user.username}</strong>
                </Text>

                <Text size="sm">
                    We are glad you logged in. Here is the list of features signed in users get:
                    <ul>
                        <li>Upload files</li>
                        <li>Expiration time of 14 and 28 days for secrets</li>
                        <li>List and delete your secrets</li>
                    </ul>
                    More features are coming! Thanks for joining Hemmelig.app!
                    <span role="img" aria-label="celebration icon">
                        🎉 🎉 🎉 🎉
                    </span>
                </Text>
            </Stack>
        </>
    );
};

export default HomeAccount;
