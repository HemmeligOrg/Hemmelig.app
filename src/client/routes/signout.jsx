import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { userLoginChanged, userLogin } from '../actions/';
import { removeCookie } from '../helpers/cookie';
import { signOut } from '../api/authentication';

const SignOut = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        removeCookie();

        signOut();

        dispatch(userLogin({ username: '' }));
        dispatch(userLoginChanged(false));
    }, []);

    return <Navigate replace to="/signin" />;
};

export default SignOut;
