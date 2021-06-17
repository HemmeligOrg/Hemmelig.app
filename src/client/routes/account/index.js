import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { getToken, hasToken } from '../../helpers/token';
import { route } from 'preact-router';
import style from './style.css';

import Wrapper from '../../components/wrapper';
import Input from '../../components/form/input';
import Button from '../../components/form/button';

import Error from '../../components/info/error';
import Info from '../../components/info/info';

import { removeToken } from '../../helpers/token';

import { verify } from '../../api/authentication';

const Account = () => {
    const [token, _] = useState(hasToken() ? getToken() : '');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [error, setError] = useState(null);
    const [user, setUser] = useState({});

    useEffect(() => {
        if (token) {
            (async () => {
                try {
                    const verified = await verify(token);

                    if (verified.statusCode === 401) {
                        setError('Not logged in');

                        return;
                    }

                    const { user } = verified;

                    setIsLoggedIn(true);
                    setUser(user);
                    setError(null);
                } catch (e) {
                    setError(e);
                }
            })();
        } else {
            route('/signin', true);
        }
    }, [token]);

    const onSignOut = () => {
        removeToken();
        setIsLoggedIn(false);
        setUser({});

        route('/signin', true);
    };

    if (!isLoggedIn) {
        return <Error>{error}</Error>;
    }

    return (
        <>
            <Wrapper>
                <h1>Account</h1>
                <Info>Hi, {user.username}</Info>

                <h2>API Access:</h2>

                <Input
                    type="text"
                    placeholder="key:token"
                    value={`${user.username}:${user.basicAuthToken}@${window.location.host}/api/*`}
                    readonly
                />

                <Button buttonType="burn" onClick={onSignOut}>
                    Sign out
                </Button>
            </Wrapper>
        </>
    );
};

export default Account;
