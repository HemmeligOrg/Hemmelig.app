import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

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
    const [file, setFile] = useState(null);
    const [isDownloaded, setIsDownloaded] = useState(false);
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

            if (json.file) {
                setFile(json.file);
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

    const onFileDownload = (event) => {
        event.preventDefault();

        downloadFile({
            ...file,
            encryptionKey,
            secretId,
        });

        setIsDownloaded(true);
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
                {file && !isDownloaded && (
                    <Button buttonType="burn" onClick={onFileDownload} full>
                        Download the secret file
                    </Button>
                )}
            </Wrapper>

            {error && <Error>{error}</Error>}
        </>
    );
};

export default Secret;
