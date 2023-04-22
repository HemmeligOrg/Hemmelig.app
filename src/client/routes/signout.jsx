import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Title, Group } from '@mantine/core';
import { userLoginChanged, userLogin } from '../actions/';
import { removeCookie } from '../helpers/cookie';
import { signOut } from '../api/authentication';

const SignOut = () => {
    const dispatch = useDispatch();
    const [redirect, setRedirect] = useState(false);

    useEffect(() => {
        removeCookie();

        signOut();

        dispatch(userLogin({ username: '' }));
        dispatch(userLoginChanged(false));

        setTimeout(() => {
            setRedirect(true);
        }, 1500);
    }, []);

    if (!redirect) {
        return (
            <>
                <Group>
                    <Title>Signing out...</Title>
                </Group>
            </>
        );
    }

    return <>{redirect && <Navigate to="/signin" />}</>;
};

export default SignOut;
