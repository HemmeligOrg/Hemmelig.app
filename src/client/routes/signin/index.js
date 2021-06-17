import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import style from './style.css';

import Wrapper from '../../components/wrapper';
import Input from '../../components/form/input';
import Button from '../../components/form/button';
import Error from '../../components/info/error';
import Info from '../../components/info/info';
import Success from '../../components/info/success';

import { signIn, signUp } from '../../api/authentication';

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

    useEffect(() => {
        if (success) {
            route('/account', true);
        }
    }, [success]);

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

    const onSignUp = async (event) => {
        event.preventDefault();

        const data = await signUp(username, password);

        if (data.error) {
            setError(data.error);
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
                <div class={style.form}>
                    <h1>Sign in</h1>

                    <Info>Everything you need to access, and manage the Hemmelig secrets.</Info>

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
                    <div class={style.buttonWrapper}>
                        <Button buttonType="create" onClick={onSignIn}>
                            Sign in
                        </Button>
                        <Button buttonType="burn" onClick={onSignUp}>
                            Sign up
                        </Button>
                    </div>
                </div>
            </Wrapper>

            {success && <Success>Redirecting to your account page.</Success>}
            {error && <Error>{error}</Error>}
        </>
    );
};

export default Secret;
