import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { getToken, hasToken } from '../../helpers/token';
import { Link, route } from 'preact-router';
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

                <h2>Basic auth:</h2>

                <Info align="left">User</Info>
                <Input type="text" placeholder="key" value={user.username} readonly />

                <Info align="left">Token</Info>
                <Input type="text" placeholder="key" value={user.basicAuthToken} readonly />

                <Info align="left">
                    For information about how to use the API, please have a look at the{' '}
                    <Link href="/api-docs">API documentation</Link>.
                </Info>

                <Button buttonType="burn" onClick={onSignOut}>
                    Sign out
                </Button>
            </Wrapper>
        </>
    );
};

export default Account;
