import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Container, Title, Center, Text, Image, Stack } from '@mantine/core';
import { userLoginChanged, userLogin } from '../../actions';
import { removeCookie } from '../../helpers/cookie';
import { signOut } from '../../api/authentication';
import styles from './style.module.css';

const SignOut = () => {
    const dispatch = useDispatch();
    const [redirect, setRedirect] = useState(false);

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
                        <Title order={3}>Signing out...</Title>
                    </Center>
                    <Center>
                        <Text>Please wait...</Text>
                    </Center>
                    <Center>
                        <Image
                            maw={240}
                            radius="md"
                            src="./secret_cat.png"
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
