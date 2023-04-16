import { useEffect } from 'react';
import { Redirect } from 'react-router-dom';
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

    return <Redirect push to="/signin" />;
};

export default SignOut;
