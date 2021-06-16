import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import style from './style.css';

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

            return;
        }

        setTokenState(data.token);
        setError(null);
        setSuccess(true);
    };

    return (
        <>
            <Wrapper>
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

                <Button buttonType="create" onClick={onSignIn} full>
                    Sign in
                </Button>
            </Wrapper>

            {success && <Success>Redirecting to your account page.</Success>}
            {error && <Error>{error}</Error>}
        </>
    );
};

export default Secret;
