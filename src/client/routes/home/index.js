import React from 'react';
import { useEffect, useState, useRef } from 'react';
import passwordGenerator from 'generate-password';
import {
    Button,
    Checkbox,
    Container,
    Textarea,
    TextInput,
    Select,
    CopyButton,
    ActionIcon,
    Tooltip,
    Group,
    Stack,
    Title,
    Text,
    Divider,
    FileButton,
    NumberInput,
    Badge,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
    IconSquarePlus,
    IconTrash,
    IconLock,
    IconLockAccess,
    IconLink,
    IconCopy,
    IconCheck,
    IconHeading,
    IconShare,
} from '@tabler/icons';
import { useSelector } from 'react-redux';

import config from '../../config';

import Error from '../../components/info/error';

import { getToken } from '../../helpers/token';
import { zipFiles } from '../../helpers/zip';
import { createSecret, burnSecret } from '../../api/secret';
import { generateKey, encrypt } from '../../../shared/helpers/crypto';
import { useTranslation } from 'react-i18next';

const Home = () => {
    const [text, setText] = useState('');
    const [title, setTitle] = useState('');
    const [maxViews, setMaxViews] = useState(1);
    const [enableFileUpload] = useState(config.get('settings.enableFileUpload', false));
    const [files, setFiles] = useState([]);
    const [ttl, setTTL] = useState(14400);
    const [password, setPassword] = useState('');
    const [enablePassword, setOnEnablePassword] = useState(false);
    const [allowedIp, setAllowedIp] = useState('');
    const [preventBurn, setPreventBurn] = useState(false);
    const [secretId, setSecretId] = useState('');
    const [encryptionKey, setEncryptionKey] = useState('');
    const [creatingSecret, setCreatingSecret] = useState(false);

    const [error, setError] = useState('');
    const [secretError, setSecretError] = useState('');

    const secretRef = useRef(null);

    const isMobile = useMediaQuery('(max-width: 915px)');

    const isLoggedIn = useSelector((state) => state.isLoggedIn);

    const { t } = useTranslation();
    useEffect(() => {
        if (secretId) {
            secretRef.current.focus();
        }
    }, [secretId]);

    useEffect(() => {
        if (enablePassword) {
            setPassword(
                passwordGenerator.generate({
                    length: 16,
                    numbers: true,
                    strict: true,
                    symbols: true,
                })
            );
        } else {
            setPassword('');
        }
    }, [enablePassword]);

    const onTextareaChange = (event) => {
        setText(event.target.value);
    };

    const onTitleChange = (event) => {
        setTitle(event.target.value);
    };

    const onMaxViewsChange = (value) => {
        setMaxViews(value);
    };

    const onSelectChange = (value) => {
        setTTL(value);
    };

    const onPasswordChange = (event) => {
        setPassword(event.target.value);
    };

    const onIpChange = (event) => {
        setAllowedIp(event.target.value);
    };

    const onPreventBurnChange = () => {
        setPreventBurn(!preventBurn);
    };

    const onEnablePassword = () => {
        setOnEnablePassword(!enablePassword);
    };

    const reset = () => {
        setText('');
        setSecretId('');
        setError('');
        setPassword('');
        setEncryptionKey('');
        setAllowedIp('');
        setFiles([]);
        setTitle('');
        setPreventBurn(false);
        setOnEnablePassword(false);
        setMaxViews(1);
        setCreatingSecret(false);
    };

    const onSubmit = async (event) => {
        if (!text) {
            setSecretError(t('home.please_add_secret'));

            return;
        }

        const userEncryptionKey = generateKey();

        setCreatingSecret(true);

        event.preventDefault();

        const body = {
            text: encrypt(text, userEncryptionKey),
            files: [],
            title: encrypt(title, userEncryptionKey),
            password,
            ttl,
            allowedIp,
            preventBurn,
            maxViews,
        };

        const zipFile = await zipFiles(files);

        if (zipFile) {
            body.files.push({
                type: 'application/zip',
                ext: '.zip',
                content: encrypt(zipFile, userEncryptionKey),
            });
        }

        const json = await createSecret(body, getToken());

        if (json.statusCode !== 201) {
            if (json.message === 'request file too large, please check multipart config') {
                setError('The file size is too large');
            } else {
                setError(json.error);
            }

            setCreatingSecret(false);

            return;
        }

        setSecretId(json.id);
        setEncryptionKey(userEncryptionKey);
        setError('');
        setCreatingSecret(false);
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

    const onShare = (event) => {
        event.preventDefault();

        if (navigator.share) {
            navigator
                .share({
                    title: 'hemmelig.app',
                    text: t('home.get_your_secret'),
                    url: getSecretURL(),
                })
                .then(() => console.log(t('home.successful_share')))
                .catch(console.error);
        }
    };

    const handleFocus = (event) => event.target.select();

    const getSecretURL = () => `${window.location.href}secret/${encryptionKey}/${secretId}`;

    const inputReadOnly = !!secretId;

    const ttlValues = [
        { value: 604800, label: t('home.7_days') },
        { value: 259200, label: t('home.3_days') },
        { value: 86400, label: t('home.1_day') },
        { value: 43200, label: t('home.12_hours') },
        { value: 14400, label: t('home.4_hours') },
        { value: 3600, label: t('home.1_hour') },
        { value: 1800, label: t('home.30_minutes') },
        { value: 300, label: t('home.5_minutes') },
    ];

    // Features allowed for signed in users only
    // This is validated from the server as well
    if (isLoggedIn) {
        ttlValues.unshift(
            { value: 2419200, label: t('home.28_days') },
            { value: 1209600, label: t('home.14_days') }
        );
    }

    const groupMobileStyle = () => {
        if (!isMobile) {
            return {};
        }

        return {
            root: {
                maxWidth: '100% !important',
            },
        };
    };

    return (
        <Container>
            <Stack>
                <Title order={1} align="center">
                    {t('home.app_subtitle')}
                </Title>
                <Text size="sm" align="center">
                    {t('home.welcome')}
                </Text>
                <Textarea
                    minRows={10}
                    maxRows={secretId ? 4 : 1000}
                    autosize
                    placeholder={t('home.maintxtarea')}
                    onChange={onTextareaChange}
                    value={text}
                    readOnly={inputReadOnly}
                    error={secretError}
                />

                <Group grow>
                    <TextInput
                        styles={groupMobileStyle}
                        icon={<IconHeading size={14} />}
                        placeholder={t('home.title')}
                        value={title}
                        onChange={onTitleChange}
                        readOnly={inputReadOnly}
                    />
                </Group>

                <Group grow>
                    <Select
                        value={ttl}
                        onChange={onSelectChange}
                        data={ttlValues}
                        label={t('home.lifetime')}
                    />

                    <NumberInput
                        onChange={onMaxViewsChange}
                        defaultValue={1}
                        min={0}
                        max={999}
                        placeholder="1"
                        label={t('home.max_views')}
                    />
                </Group>

                <Group grow>
                    <Checkbox
                        styles={groupMobileStyle}
                        checked={enablePassword}
                        onChange={onEnablePassword}
                        readOnly={inputReadOnly}
                        color="hemmelig"
                        label={t('home.enable_password')}
                    />

                    <TextInput
                        styles={groupMobileStyle}
                        icon={<IconLock size={14} />}
                        placeholder={t('home.optional_password')}
                        value={password}
                        onChange={onPasswordChange}
                        readOnly={!enablePassword || inputReadOnly}
                        rightSection={
                            <CopyButton value={password} timeout={2000}>
                                {({ copied, copy }) => (
                                    <Tooltip
                                        label={copied ? t('copied') : t('copy')}
                                        withArrow
                                        position="right"
                                    >
                                        <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                                            {copied ? (
                                                <IconCheck size={16} />
                                            ) : (
                                                <IconCopy size={16} />
                                            )}
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                            </CopyButton>
                        }
                    />
                </Group>

                <Group grow>
                    <Checkbox
                        styles={groupMobileStyle}
                        checked={preventBurn}
                        onChange={onPreventBurnChange}
                        readOnly={inputReadOnly}
                        color="hemmelig"
                        label={t('home.burn_aftertime')}
                    />

                    <Tooltip label={t('home.restrict_from_ip')}>
                        <TextInput
                            styles={groupMobileStyle}
                            icon={<IconLockAccess size={14} />}
                            placeholder={t('home.restrict_from_ip_placeholder')}
                            value={allowedIp}
                            onChange={onIpChange}
                            readOnly={inputReadOnly}
                        />
                    </Tooltip>
                </Group>

                <Group grow={isMobile}>
                    {enableFileUpload && (
                        <FileButton
                            onChange={setFiles}
                            disabled={!isLoggedIn}
                            styles={groupMobileStyle}
                            multiple
                        >
                            {(props) => (
                                <Button
                                    {...props}
                                    label={!isLoggedIn ? t('home.login_to_upload') : ''}
                                    styles={() => ({
                                        root: {
                                            backgroundColor: '#FF9769',

                                            '&:hover': {
                                                backgroundColor: '#FF9769',
                                                filter: 'brightness(115%)',
                                            },
                                        },
                                    })}
                                >
                                    {t('home.upload_files')}
                                </Button>
                            )}
                        </FileButton>
                    )}

                    {enableFileUpload && !isLoggedIn && (
                        <Text size="sm" align="center" mt="sm">
                            {t('home.login_to_upload')}
                        </Text>
                    )}
                </Group>

                {files.length > 0 && (
                    <Group>
                        {files.map((file) => (
                            <Badge color="orange" key={file.name}>
                                {file.name}
                            </Badge>
                        ))}
                    </Group>
                )}

                {secretId && (
                    <Group grow>
                        <TextInput
                            label={t('home.your_secret_url')}
                            icon={<IconLink size={14} />}
                            value={getSecretURL()}
                            onFocus={handleFocus}
                            ref={secretRef}
                            readOnly
                            rightSection={
                                <CopyButton value={getSecretURL()} timeout={2000}>
                                    {({ copied, copy }) => (
                                        <Tooltip
                                            label={copied ? t('copied') : t('copy')}
                                            withArrow
                                            position="right"
                                        >
                                            <ActionIcon
                                                color={copied ? 'teal' : 'gray'}
                                                onClick={copy}
                                            >
                                                {copied ? (
                                                    <IconCheck size={16} />
                                                ) : (
                                                    <IconCopy size={16} />
                                                )}
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                </CopyButton>
                            }
                        />
                    </Group>
                )}

                {isMobile && secretId && navigator.share && (
                    <Group grow>
                        <Button
                            styles={() => ({
                                root: {
                                    backgroundColor: 'var(--color-contrast-second)',
                                    '&:hover': {
                                        backgroundColor: 'var(--color-contrast-second)',
                                        filter: 'brightness(115%)',
                                    },
                                },
                            })}
                            onClick={onShare}
                            leftIcon={<IconShare size={16} />}
                        >
                            {t('home.share')}
                        </Button>
                    </Group>
                )}

                <Group position="right" grow={isMobile}>
                    {!secretId && (
                        <Button
                            styles={() => ({
                                root: {
                                    backgroundColor: 'var(--color-contrast)',

                                    '&:hover': {
                                        backgroundColor: 'var(--color-contrast)',
                                        filter: 'brightness(115%)',
                                    },
                                },
                            })}
                            leftIcon={<IconSquarePlus size={14} />}
                            onClick={onSubmit}
                            loading={creatingSecret}
                        >
                            {t('home.create_secret_link')}
                        </Button>
                    )}

                    {secretId && (
                        <Button
                            styles={() => ({
                                root: {
                                    backgroundColor: 'var(--color-contrast)',

                                    '&:hover': {
                                        backgroundColor: 'var(--color-contrast)',
                                        filter: 'brightness(115%)',
                                    },
                                },
                            })}
                            leftIcon={<IconSquarePlus size={14} />}
                            onClick={onNewSecret}
                        >
                            {t('home.create_new')}
                        </Button>
                    )}

                    {secretId && (
                        <Button
                            variant="gradient"
                            gradient={{ from: 'orange', to: 'red' }}
                            onClick={onBurn}
                            disabled={!secretId}
                            leftIcon={<IconTrash size={14} />}
                        >
                            {t('home.delete')}
                        </Button>
                    )}
                </Group>
            </Stack>

            {error && <Error>{error}</Error>}

            <Divider my="sm" variant="dashed" />

            <Stack spacing="xs">
                <Text size="sm" align="center">
                    {t('home.link_only_works_once')}
                </Text>

                <Text size="sm" align="center">
                    <strong>Hemmelig</strong>, {t('home.app_name_meaning')}
                </Text>
            </Stack>
        </Container>
    );
};

export default Home;
