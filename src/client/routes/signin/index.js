import React from 'react';
import { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import style from './style.module.css';

import Wrapper from '../../components/wrapper';
import Input from '../../components/form/input';
import Button from '../../components/form/button';
import Error from '../../components/info/error';
import Info from '../../components/info/info';
import Success from '../../components/info/success';

import { signIn } from '../../api/authentication';

import { setToken } from '../../helpers/token';

const Secret = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [token, setTokenState] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (token) {
            setToken(token);
        }
    }, [token]);

    const onUsernameChange = (event) => {
        setUsername(event.target.value);
    };

    const onPasswordChange = (event) => {
        setPassword(event.target.value);
    };

    const onSignIn = async (event) => {
        event.preventDefault();

        const data = await signIn(username, password);

        if (data.statusCode === 401) {
            setError('Wrong username or password. Please try again.');
            setSuccess(false);

            return;
        }

        setTokenState(data.token);
        setError(null);
        setSuccess(true);
    };

    return (
        <>
            <Wrapper>
                <div className={style.form}>
                    <h1>Sign in</h1>

                    <Info>Everything you need to access, and manage the Hemmelig secrets.</Info>
                    <form>
                        <Input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={onUsernameChange}
                            required
                        />

                        <Input
                            type="password"
                            placeholder="Your password"
                            value={password}
                            onChange={onPasswordChange}
                            required
                        />

                        <div className={style.buttonWrapper}>
                            <Button buttonType="burn" onClick={onSignIn}>
                                Sign in
                            </Button>
                        </div>
                    </form>
                </div>
            </Wrapper>

            {success && (
                <Success>
                    Redirecting to your account page. <Redirect to="/account" />
                </Success>
            )}
            {error && <Error>{error}</Error>}
        </>
    );
};

export default Secret;
