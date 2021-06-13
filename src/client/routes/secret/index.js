import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import style from './style.css';

import Wrapper from '../../components/wrapper';
import Input from '../../components/form/input';
import Textarea from '../../components/form/textarea';
import Button from '../../components/form/button';
import Error from '../../components/info/error';
import Info from '../../components/info/info';

import { getSecret, burnSecret } from '../../api/secret';

const Secret = ({ secretId }) => {
    const [secret, setSecret] = useState(null);
    const [isSecretOpen, setIsSecretOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [isPasswordRequired, setIsPasswordRequired] = useState(false);
    const [error, setError] = useState(null);

    const fetchSecret = async (event) => {
        event.preventDefault();

        if (isPasswordRequired && !password) {
            return;
        }

        if (secret) {
            setIsSecretOpen(true);

            return;
        }

        const json = await getSecret(secretId, password);

        if (json.statusCode === 401) {
            setIsPasswordRequired(true);

            setError('Incorrect password!');

            return;
        }

        if (json.error) {
            setError(json.error);
        } else {
            setSecret(json.secret);

            setIsSecretOpen(true);

            setError(null);
        }
    };

    useEffect(() => {
        (async () => {
            const response = await getSecret(secretId, password);

            if (response.statusCode === 401) {
                setIsPasswordRequired(true);

                return () => {};
            }

            if (!response.error) {
                setSecret(response.secret);
            } else {
                setError(response.error);
            }
        })();
    }, []);

    useEffect(() => {
        if (isSecretOpen) {
            burnSecret(secretId);
        }
    }, [isSecretOpen, secretId]);

    const onPasswordChange = (event) => {
        setPassword(event.target.value);
    };

    return (
        <>
            <Wrapper>
                <h1>View your secret</h1>

                <Info>We will only show the secret once.</Info>

                {isSecretOpen && (
                    <Textarea class={style.textarea} thickBorder={true} readonly>
                        {secret}
                    </Textarea>
                )}

                {isPasswordRequired && !isSecretOpen && (
                    <>
                        <Info>A password is required to open this secret</Info>
                        <Input
                            type="password"
                            placeholder="Your password"
                            value={password}
                            onChange={onPasswordChange}
                        />
                    </>
                )}

                {!isSecretOpen && (
                    <Button buttonType="create" onClick={fetchSecret} full>
                        View secret
                    </Button>
                )}
            </Wrapper>

            {error && <Error>{error}</Error>}
        </>
    );
};

export default Secret;
