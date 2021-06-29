import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import style from './style.css';

import Wrapper from '../../components/wrapper';
import Input from '../../components/form/input';
import Textarea from '../../components/form/textarea';
import Button from '../../components/form/button';
import Error from '../../components/info/error';
import Info from '../../components/info/info';

import { getSecret, secretExists } from '../../api/secret';
import { downloadFile } from '../../api/upload';

const Secret = ({ secretId, encryptionKey = null }) => {
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

        const json = await getSecret(secretId, encryptionKey, password);

        if (json.statusCode === 401) {
            setIsPasswordRequired(true);

            setError('Incorrect password!');

            return;
        }

        if (json.error) {
            setError(json.error);
        } else {
            setSecret(json.secret);

            if (json.file_key) {
                downloadFile({
                    key: json.file_key,
                    extension: json.file_extension,
                    mimetype: json.file_mimetype,
                    encryptionKey,
                    secretId,
                });
            }

            setIsSecretOpen(true);

            setError(null);
        }
    };

    useEffect(() => {
        (async () => {
            const response = await secretExists(secretId, password);

            if (response.statusCode === 401) {
                setIsPasswordRequired(true);

                return () => {};
            }

            if (response.error) {
                setError(response.error);
            }
        })();
    }, []);

    const onPasswordChange = (event) => {
        setPassword(event.target.value);
    };

    return (
        <>
            <Wrapper>
                <h1>View your secret</h1>

                <Info>We will only show the secret once.</Info>

                {isSecretOpen && (
                    <Textarea thickBorder={true} readonly>
                        {secret}
                    </Textarea>
                )}

                {isPasswordRequired && !isSecretOpen && (
                    <>
                        <Info>A password is required to open this secret</Info>
                        <Input
                            placeholder="Your password"
                            value={password}
                            onChange={onPasswordChange}
                            style="-webkit-text-security: disc;" // hack for password prompt
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
