import React from 'react';
import { useEffect, useState } from 'react';
import { getToken, hasToken } from '../../helpers/token';
import { Link, Redirect } from 'react-router-dom';

import Wrapper from '../../components/wrapper';
import Input from '../../components/form/input';
import Spinner from '../../components/spinner';

import Error from '../../components/info/error';
import Info from '../../components/info/info';

import emitter from '../../helpers/state-emitter';
import { getUser } from '../../api/account';

const Account = () => {
    const [token, _] = useState(hasToken() ? getToken() : '');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [error, setError] = useState(null);
    const [user, setUser] = useState({});

    useEffect(() => {
        if (!token) {
            return;
        }

        (async () => {
            try {
                const response = await getUser(token);

                if (response.statusCode === 401 || response.statusCode === 500) {
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

    useEffect(() => {
        emitter.emit('isLoggedIn', isLoggedIn);
    }, [isLoggedIn]);

    if (error) {
        return <Error>{error}</Error>;
    }

    if (!token) {
        return <Redirect to="/signin" />;
    }

    if (!isLoggedIn) {
        return <Spinner />;
    }

    return (
        <>
            <Wrapper>
                <h1>Account</h1>
                <Info align="left">
                    Hi, <strong>{user.username}</strong>
                </Info>
                <Info align="left">
                    We are glad you logged in. Now you earned the right to upload images that will
                    be encryptet to be shared with anyone!
                </Info>

                <Info align="left">
                    <strong>BASIC AUTH:</strong>
                </Info>
                <Info align="left">
                    <strong>User</strong>
                </Info>
                <Input type="text" placeholder="key" value={user.username} readOnly />

                <Info align="left">
                    <strong>Token</strong>
                </Info>
                <Input type="text" placeholder="key" value={user.basicAuthToken} readOnly />

                <Info align="left">
                    For information about how to use the API, please have a look at the{' '}
                    <Link to="/api-docs">API documentation</Link>.
                </Info>
            </Wrapper>
        </>
    );
};

export default Account;
