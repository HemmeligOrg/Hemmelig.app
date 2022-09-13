import React from 'react';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import {
    Button,
    Divider,
    Group,
    Container,
    Textarea,
    TextInput,
    Stack,
    Title,
    Text,
} from '@mantine/core';
import {
    IconSquarePlus,
    IconDownload,
    IconLock,
    IconEye,
    IconPerspective,
    IconHeading,
} from '@tabler/icons';

import Error from '../../components/info/error';

import { getSecret, secretExists } from '../../api/secret';
import { downloadFile } from '../../api/upload';
import { getToken } from '../../helpers/token';
import { decrypt } from '../../../shared/helpers/crypto';

import { useTranslation } from 'react-i18next';

const Secret = () => {
    const { t } = useTranslation();

    const { secretId, encryptionKey = null } = useParams();
    const [secret, setSecret] = useState(null);
    const [title, setTitle] = useState(null);
    const [preventBurn, setPreventBurn] = useState(false);
    const [isSecretOpen, setIsSecretOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [isPasswordRequired, setIsPasswordRequired] = useState(false);
    const [files, setFiles] = useState(null);
    const [isDownloaded, setIsDownloaded] = useState([]);
    const [error, setError] = useState(null);
    const [hasConvertedBase64ToPlain, setHasConvertedBase64ToPlain] = useState(false);

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
            try {
                const text = decrypt(json.secret, encryptionKey);

                setSecret(text);
            } catch (error) {
                setError(error.message);

                return;
            }

            if (json.title) {
                setTitle(decrypt(json.title, encryptionKey));
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
            }
        })();
        // eslint-disable-next-line
    }, [secretId]);

    const onPasswordChange = (event) => {
        setPassword(event.target.value);
    };

    const onFileDownload = (file) => {
        downloadFile(
            {
                file,
                secretId,
                encryptionKey,
            },
            getToken()
        );

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

                <Text>{t('secret.will_show_once')}</Text>

                {title && <TextInput icon={<IconHeading size={14} />} value={title} readOnly />}

                {isSecretOpen && (
                    <Textarea minRows={10} maxRows={30} value={secret} autosize readOnly />
                )}

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
                                {file.key + file.ext}
                            </Button>
                        ))}
                </Group>
            </Stack>

            {error && <Error>{error}</Error>}
        </Container>
    );
};

export default Secret;
