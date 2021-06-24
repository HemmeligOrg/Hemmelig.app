import { h } from 'preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import style from './style.css';

import Wrapper from '../../components/wrapper';
import InputGroup from '../../components/form/input-group';
import Input from '../../components/form/input';
import Textarea from '../../components/form/textarea';
import Select from '../../components/form/select';
import Button from '../../components/form/button';
import Error from '../../components/info/error';
import Info from '../../components/info/info';
import Share from '../../components/share';

import { createSecret, burnSecret } from '../../api/secret';

const Home = () => {
    const [text, setText] = useState('');
    const [ttl, setTTL] = useState(3600);
    const [password, setPassword] = useState('');
    const [secretId, setSecretId] = useState('');
    const [encryptionKey, setEncryptionKey] = useState('');
    const [error, setError] = useState('');

    const secretRef = useRef(null);

    useEffect(() => {
        if (secretId) {
            secretRef.current.focus();
        }
    }, [secretId]);

    const onChangeHandler = (event) => {
        setText(event.target.value);
    };

    const onSelectChange = (event) => {
        setTTL(event.target.value);
    };

    const onPasswordChange = (event) => {
        setPassword(event.target.value);
    };

    const onSubmit = async (event) => {
        if (!text) {
            setError('Please add a secret.');

            return;
        }

        event.preventDefault();

        const json = await createSecret(text, password, ttl);

        setSecretId(json.id);
        setEncryptionKey(json.key);
        setError('');
    };

    const onNewSecret = async (event) => {
        event.preventDefault();

        setText('');
        setSecretId('');
        setError('');
        setPassword('');
        setEncryptionKey('');
    };

    const onBurn = async (event) => {
        if (!secretId) {
            return;
        }

        event.preventDefault();

        burnSecret(secretId);

        setText('');
        setSecretId('');
        setEncryptionKey('');
    };

    const handleFocus = (event) => event.target.select();

    const getSecretURL = () => `${window.location.href}secret/${encryptionKey}/${secretId}`;

    return (
        <>
            <Wrapper>
                <h1 class={style.h1}>Paste a password, secret message, or private information.</h1>
                <Info>
                    Keep your sensitive information out of chat logs, emails, and more with heavily
                    encrypted secrets.
                </Info>
                <div class={style.form}>
                    <Textarea
                        compress={secretId}
                        placeholder="Insert secret.."
                        onChange={onChangeHandler}
                        value={text}
                        readonly={!!secretId}
                        thickBorder={!!secretId}
                    />
                    <InputGroup>
                        <Select value={ttl} onChange={onSelectChange}>
                            <option value="604800">7 days</option>
                            <option value="259200">3 days</option>
                            <option value="86400">1 day</option>
                            <option value="43200">12 hours</option>
                            <option value="14400">4 hours</option>
                            <option value="3600">1 hour</option>
                            <option value="1800">30 minutes</option>
                            <option value="300">5 minutes</option>
                        </Select>
                        <Input
                            placeholder="Your optional password"
                            type="password"
                            value={password}
                            onChange={onPasswordChange}
                            readonly={!!secretId}
                        />
                    </InputGroup>
                    {secretId && (
                        <>
                            <Info align="left">
                                <Share url={getSecretURL()}></Share>
                            </Info>

                            <Input
                                value={getSecretURL()}
                                onFocus={handleFocus}
                                ref={secretRef}
                                readonly
                            />
                        </>
                    )}
                    <div class={style.buttonWrapper}>
                        {!secretId && (
                            <Button buttonType="create" onClick={onSubmit}>
                                Create a secret link
                            </Button>
                        )}

                        {secretId && (
                            <Button buttonType="create" onClick={onNewSecret}>
                                Create a new secret
                            </Button>
                        )}

                        {secretId && (
                            <Button buttonType="burn" onClick={onBurn} disabled={!secretId}>
                                Burn the secret
                            </Button>
                        )}
                    </div>
                </div>
            </Wrapper>

            {error && <Error>{error}</Error>}

            <Info>The secret link only works once, and then it will disappear.</Info>

            <Info>
                <strong>Hemmelig</strong>, [he`m:(ə)li], means secret in Norwegian.
            </Info>
        </>
    );
};

export default Home;
