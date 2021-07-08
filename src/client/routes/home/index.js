import React from 'react';
import { useEffect, useState, useRef } from 'react';
import style from './style.module.css';

import Wrapper from '../../components/wrapper';
import InputGroup from '../../components/form/input-group';
import Input from '../../components/form/input';
import Textarea from '../../components/form/textarea';
import Select from '../../components/form/select';
import Button from '../../components/form/button';
import Error from '../../components/info/error';
import Info from '../../components/info/info';
import Share from '../../components/share';
import Expandable from '../../components/expandable';

import { getToken, hasToken } from '../../helpers/token';

import { createSecret, burnSecret } from '../../api/secret';

const Home = () => {
    const [text, setText] = useState('');
    const [isTextActive, setIsTextActive] = useState(false);
    const [file, setFile] = useState('');
    const [ttl, setTTL] = useState(14400);
    const [password, setPassword] = useState('');
    const [allowedIp, setAllowedIp] = useState('');
    const [formData, setFormData] = useState(null);
    const [secretId, setSecretId] = useState('');
    const [encryptionKey, setEncryptionKey] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [error, setError] = useState('');

    const secretRef = useRef(null);

    useEffect(() => {
        // Run once to initialize the form data to post
        setFormData(new FormData());

        setIsLoggedIn(hasToken());
    }, []);

    useEffect(() => {
        if (secretId) {
            secretRef.current.focus();
        }
    }, [secretId]);

    const onTextareChange = (event) => {
        setText(event.target.value);
    };

    const onTextareaActive = () => {
        setIsTextActive(!isTextActive);
    };

    const onFileChange = (event) => {
        // Support multi upload at a later stage
        const [file] = event.target.files;

        setFile(file);
    };

    const onSelectChange = (event) => {
        setTTL(event.target.value);
    };

    const onPasswordChange = (event) => {
        setPassword(event.target.value);
    };

    const onIpChange = (event) => {
        setAllowedIp(event.target.value);
    };

    const reset = () => {
        setText('');
        setSecretId('');
        setError('');
        setPassword('');
        setEncryptionKey('');
        setAllowedIp('');
        setFile('');
    };

    const onSubmit = async (event) => {
        if (!text) {
            setError('Please add a secret.');

            return;
        }

        event.preventDefault();

        formData.append('text', text);
        formData.append('password', password);
        formData.append('ttl', ttl);
        formData.append('allowedIp', allowedIp);
        formData.append('file', file);

        const json = await createSecret(formData, getToken());

        if (json.statusCode !== 201) {
            setError(json.error);

            return;
        }

        setSecretId(json.id);
        setEncryptionKey(json.key);
        setError('');
    };

    const onNewSecret = async (event) => {
        event.preventDefault();

        reset();
    };

    const onBurn = async (event) => {
        if (!secretId) {
            return;
        }

        event.preventDefault();

        burnSecret(secretId);

        reset();
    };

    const handleFocus = (event) => event.target.select();

    const getSecretURL = () => `${window.location.href}secret/${encryptionKey}/${secretId}`;

    const inputReadOnly = !!secretId;

    return (
        <>
            <Wrapper>
                <h1 className={style.h1}>
                    Paste a password, secret message, or private information.
                </h1>
                <Info>
                    Keep your sensitive information out of chat logs, emails, and more with heavily
                    encrypted secrets.
                </Info>
                <div className={style.form}>
                    <Textarea
                        compress={secretId}
                        placeholder="Write your sensitive information.."
                        onChange={onTextareChange}
                        value={text}
                        readOnly={inputReadOnly}
                        thickBorder={inputReadOnly}
                        onFocus={onTextareaActive}
                        onBlur={onTextareaActive}
                        isActive={isTextActive}
                    />

                    {!isLoggedIn && (
                        <Info align="right">You have to sign in to upload an image.</Info>
                    )}
                    {isLoggedIn && (
                        <Info align="right">Only one image is currently supported.</Info>
                    )}
                    <Input
                        placeholder="Image upload"
                        type="file"
                        onChange={onFileChange}
                        disabled={!isLoggedIn}
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
                            value={password}
                            onChange={onPasswordChange}
                            readOnly={inputReadOnly}
                            style={{ WebkitTextSecurity: 'disc' }} // hack for password prompt
                        />
                    </InputGroup>

                    <Expandable>
                        <Input
                            placeholder="Restrict by IP address"
                            value={allowedIp}
                            onChange={onIpChange}
                            readOnly={inputReadOnly}
                        />
                    </Expandable>

                    {secretId && (
                        <>
                            <Info align="left">
                                <Share url={getSecretURL()}></Share>
                            </Info>

                            <Input
                                value={getSecretURL()}
                                onFocus={handleFocus}
                                ref={secretRef}
                                readOnly
                            />
                        </>
                    )}

                    <div className={style.buttonWrapper}>
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
