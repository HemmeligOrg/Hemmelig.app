import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { getToken, hasToken } from '../../helpers/token';
import { Link, route } from 'preact-router';

import Wrapper from '../../components/wrapper';
import Input from '../../components/form/input';
import Button from '../../components/form/button';
import Spinner from '../../components/spinner';

import Error from '../../components/info/error';
import Info from '../../components/info/info';

import { removeToken } from '../../helpers/token';

import { getUser } from '../../api/account';

const Account = () => {
    const [token, _] = useState(hasToken() ? getToken() : '');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [error, setError] = useState(null);
    const [user, setUser] = useState({});

    useEffect(() => {
        if (!token) {
            route('/signin', true);

            return () => {};
        }

        (async () => {
            try {
                const response = await getUser(token);

                if (response.statusCode === 401) {
                    setError('Not logged in');

                    return;
                }

                const { user } = response;

                setIsLoggedIn(true);
                setUser(user);
                setError(null);
            } catch (e) {
                setError(e);
            }
        })();
    }, [token]);

    const onSignOut = () => {
        removeToken();
        setIsLoggedIn(false);
        setUser({});

        route('/signin', true);
    };

    if (error) {
        return <Error>{error}</Error>;
    }

    if (!isLoggedIn) {
        return <Spinner />;
    }

    return (
        <>
            <Wrapper>
                <h1>Account</h1>
                <Info align="left">Hi, {user.username}</Info>
                <br />
                <Info align="left">
                    <strong>Basic auth:</strong>
                </Info>

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
