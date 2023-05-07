import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';

import { Alert, Button, Group, Container, TextInput, Stack, Title, Text } from '@mantine/core';
import {
    IconSquarePlus,
    IconDownload,
    IconLock,
    IconEye,
    IconPerspective,
    IconHeading,
    IconAlertCircle,
    IconShieldLock,
} from '@tabler/icons';

import Quill from '../../components/quill';

import { getSecret, secretExists } from '../../api/secret';
import { downloadFile } from '../../api/upload';
import { decrypt } from '../../../shared/helpers/crypto';

import { useTranslation } from 'react-i18next';

const getEncryptionKeyHash = (hash) => {
    const id = '#encryption_key=';

    if (!hash || !hash.includes(id)) {
        return '';
    }

    const [_, encryptionKey] = hash.split('#encryption_key=');

    return encryptionKey;
};

const Secret = () => {
    const { t } = useTranslation();

    const { hash = '' } = useLocation();

    const { secretId, encryptionKey = getEncryptionKeyHash(hash) } = useParams();
    const [decryptionKey, setDecryptionKey] = useState(encryptionKey);
    const [secret, setSecret] = useState(null);
    const [title, setTitle] = useState(null);
    const [preventBurn, setPreventBurn] = useState(false);
    const [maxViews, setMaxViews] = useState(0);
    const [isSecretOpen, setIsSecretOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [isPasswordRequired, setIsPasswordRequired] = useState(false);
    const [files, setFiles] = useState(null);
    const [isDownloaded, setIsDownloaded] = useState([]);
    const [error, setError] = useState(null);
    const [hasConvertedBase64ToPlain, setHasConvertedBase64ToPlain] = useState(false);

    const fetchSecret = async (event) => {
        event.preventDefault();

        if (isPasswordRequired && (!password || !decryptionKey)) {
            return;
        }

        if (!decryptionKey) {
            setError('Decryption key is required!');

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
            try {
                const text = decrypt(json.secret, decryptionKey);

                setSecret(text);
            } catch (error) {
                setError(error.message);

                return;
            }

            if (json.title) {
                setTitle(decrypt(json.title, decryptionKey));
            }

            if (json.files) {
                setFiles(json.files);
            }

            if (json.preventBurn) {
                setPreventBurn(json.preventBurn);
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
            } else {
                setMaxViews(response.maxViews);
            }
        })();
        // eslint-disable-next-line
    }, [secretId]);

    const onPasswordChange = (event) => {
        setPassword(event.target.value);
    };

    const onFileDownload = (file) => {
        downloadFile({
            file,
            secretId,
            decryptionKey,
        });

        if (!preventBurn) {
            setIsDownloaded([...isDownloaded, file.key]);
        }
    };

    const convertBase64ToPlain = () => {
        if (!hasConvertedBase64ToPlain) {
            setSecret(btoa(secret));
        } else {
            setSecret(atob(secret));
        }

        setHasConvertedBase64ToPlain(!hasConvertedBase64ToPlain);
    };

    return (
        <Container>
            <Stack>
                <Title order={1}>{t('secret.view_your_secret')}</Title>

                {error && (
                    <Alert
                        icon={<IconAlertCircle size="1rem" />}
                        title={t('home.bummer')}
                        color="red"
                        variant="outline"
                    >
                        {error}
                    </Alert>
                )}

                <Text>{t('secret.will_show_once')}</Text>

                {maxViews > 1 && (
                    <Text>
                        {t('secret.views_left')} <strong>{maxViews}</strong>
                    </Text>
                )}

                {title && <TextInput icon={<IconHeading size={14} />} value={title} readOnly />}

                {isSecretOpen && <Quill value={secret} secretId={secretId} readOnly />}

                {isPasswordRequired && !isSecretOpen && (
                    <>
                        <Text>{t('secret.password_required')}</Text>

                        <TextInput
                            id="lemon-password"
                            icon={<IconLock size={14} />}
                            placeholder="Your password"
                            value={password}
                            onChange={onPasswordChange}
                            required
                            style={{ WebkitTextSecurity: 'disc' }}
                        />
                    </>
                )}

                {!encryptionKey && !isSecretOpen && (
                    <>
                        <Text>{t('secret.decryption_key', 'Decryption key required')}</Text>

                        <TextInput
                            icon={<IconShieldLock size={14} />}
                            placeholder="Decryption key"
                            value={decryptionKey}
                            onChange={(event) => setDecryptionKey(event.target.value)}
                            required
                        />
                    </>
                )}

                <Group>
                    {!isSecretOpen && (
                        <Button
                            color="hemmelig"
                            leftIcon={<IconEye size={14} />}
                            onClick={fetchSecret}
                        >
                            {t('secret.view_secret')}
                        </Button>
                    )}
                </Group>

                <Group position="right">
                    {isSecretOpen && (
                        <Button
                            color="hemmelig-orange"
                            leftIcon={<IconPerspective size={14} />}
                            onClick={convertBase64ToPlain}
                        >
                            {!hasConvertedBase64ToPlain
                                ? t('secret.convert_b64')
                                : t('secret.convert_utf8')}
                        </Button>
                    )}

                    {isSecretOpen && (
                        <Button
                            color="hemmelig"
                            leftIcon={<IconSquarePlus size={14} />}
                            component={Link}
                            to="/"
                        >
                            {t('secret.create_secret')}
                        </Button>
                    )}

                    {files?.length &&
                        files.map((file) => (
                            <Button
                                key={file.key}
                                color="hemmelig-orange"
                                onClick={() => onFileDownload(file)}
                                disabled={isDownloaded.some((key) => key === file.key)}
                                leftIcon={<IconDownload size={14} />}
                            >
                                {'hemmelig_files' + file.ext}
                            </Button>
                        ))}
                </Group>
            </Stack>
        </Container>
    );
};

export default Secret;
