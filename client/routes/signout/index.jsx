import { Center, Container, Image, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { userLogin, userLoginChanged } from '../../actions';
import { signOut } from '../../api/authentication';
import { removeCookie } from '../../helpers/cookie';
import styles from './style.module.css';

const SignOut = () => {
    const dispatch = useDispatch();
    const [redirect, setRedirect] = useState(false);
    const { t } = useTranslation();

    useEffect(async () => {
        removeCookie();

        await signOut();

        dispatch(userLogin({ username: '' }));
        dispatch(userLoginChanged(false));

        setTimeout(() => {
            setRedirect(true);
        }, 1500);
    }, []);

    if (!redirect) {
        return (
            <Container>
                <Stack direction="row" spacing="md">
                    <Center>
                        <Title order={3}>{t('signout.title')}...</Title>
                    </Center>
                    <Center>
                        <Text>{t('signout.waiting')}...</Text>
                    </Center>
                    <Center>
                        <Image
                            maw={240}
                            radius="md"
                            src="./static/secret_cat.png"
                            alt="Secret Cat"
                            className={styles.image}
                        />
                    </Center>
                </Stack>
            </Container>
        );
    }

    return <>{redirect && <Navigate to="/signin" />}</>;
};

export default SignOut;
