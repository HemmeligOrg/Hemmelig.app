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

import { createSecret, burnSecret } from '../../api/secret';

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
    const [formData, setFormData] = useState(new FormData());
    const [secretId, setSecretId] = useState('');
    const [encryptionKey, setEncryptionKey] = useState('');
    const [creatingSecret, setCreatingSecret] = useState(false);

    const [error, setError] = useState('');
    const [secretError, setSecretError] = useState('');

    const secretRef = useRef(null);

    const isMobile = useMediaQuery('(max-width: 915px)');

    const isLoggedIn = useSelector((state) => state.isLoggedIn);

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
        setFormData(new FormData());
        setOnEnablePassword(false);
        setMaxViews(1);
        setCreatingSecret(false);
    };

    const onSubmit = async (event) => {
        if (!text) {
            setSecretError('Please add a secret.');

            return;
        }

        setCreatingSecret(true);

        event.preventDefault();

        formData.append('text', text);
        formData.append('title', title);
        formData.append('password', password);
        formData.append('ttl', ttl);
        formData.append('allowedIp', allowedIp);
        formData.append('preventBurn', preventBurn);
        formData.append('maxViews', maxViews);

        files.forEach((file) => formData.append('files[]', file));

        const json = await createSecret(formData, getToken());

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
        setEncryptionKey(json.key);
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
                    text: 'Get your secret at hemmelig.app.',
                    url: getSecretURL(),
                })
                .then(() => console.log('Successful share'))
                .catch(console.error);
        }
    };

    const handleFocus = (event) => event.target.select();

    const getSecretURL = () => `${window.location.href}secret/${encryptionKey}/${secretId}`;

    const inputReadOnly = !!secretId;

    const ttlValues = [
        { value: 604800, label: '7 days' },
        { value: 259200, label: '3 days' },
        { value: 86400, label: '1 day' },
        { value: 43200, label: '12 hours' },
        { value: 14400, label: '4 hours' },
        { value: 3600, label: '1 hour' },
        { value: 1800, label: '30 minutes' },
        { value: 300, label: '5 minutes' },
    ];

    // Features allowed for signed in users only
    // This is validated from the server as well
    if (isLoggedIn) {
        ttlValues.unshift(
            { value: 2419200, label: '28 days' },
            { value: 1209600, label: '14 days' }
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
                    Paste a password, secret message, or private information.
                </Title>
                <Text size="sm" align="center">
                    Keep your sensitive information out of chat logs, emails, and more with heavily
                    encrypted secrets.
                </Text>

                <Textarea
                    minRows={10}
                    maxRows={secretId ? 4 : 1000}
                    autosize
                    placeholder="Write your sensitive information.."
                    onChange={onTextareaChange}
                    value={text}
                    readOnly={inputReadOnly}
                    error={secretError}
                />

                <Group grow>
                    <TextInput
                        styles={groupMobileStyle}
                        icon={<IconHeading size={14} />}
                        placeholder="Title"
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
                        label="Lifetime"
                    />

                    <NumberInput
                        onChange={onMaxViewsChange}
                        defaultValue={1}
                        min={0}
                        max={999}
                        placeholder="1"
                        label="Max views"
                    />
                </Group>

                <Group grow>
                    <Checkbox
                        styles={groupMobileStyle}
                        checked={enablePassword}
                        onChange={onEnablePassword}
                        readOnly={inputReadOnly}
                        color="hemmelig"
                        label="Enable password"
                    />

                    <TextInput
                        styles={groupMobileStyle}
                        icon={<IconLock size={14} />}
                        placeholder="Your optional password"
                        value={password}
                        onChange={onPasswordChange}
                        readOnly={!enablePassword || inputReadOnly}
                        rightSection={
                            <CopyButton value={password} timeout={2000}>
                                {({ copied, copy }) => (
                                    <Tooltip
                                        label={copied ? 'Copied' : 'Copy'}
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
                        label="Burn the secret only after the time expires"
                    />

                    <Tooltip label="Restrict the secret from being opened based on an IP or a CIDR range. Example CIDR: 192.168.1.0/24.">
                        <TextInput
                            styles={groupMobileStyle}
                            icon={<IconLockAccess size={14} />}
                            placeholder="Restrict by IP or CIDR"
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
                                    label={!isLoggedIn ? 'Sign in to upload files' : ''}
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
                                    Upload files
                                </Button>
                            )}
                        </FileButton>
                    )}

                    {enableFileUpload && !isLoggedIn && (
                        <Text size="sm" align="center" mt="sm">
                            Sign in to upload files
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
                            label="Your secret URL"
                            icon={<IconLink size={14} />}
                            value={getSecretURL()}
                            onFocus={handleFocus}
                            ref={secretRef}
                            readOnly
                            rightSection={
                                <CopyButton value={getSecretURL()} timeout={2000}>
                                    {({ copied, copy }) => (
                                        <Tooltip
                                            label={copied ? 'Copied' : 'Copy'}
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
                            Share
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
                            Create a secret link
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
                            Create new
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
                            Delete
                        </Button>
                    )}
                </Group>
            </Stack>

            {error && <Error>{error}</Error>}

            <Divider my="sm" variant="dashed" />

            <Stack spacing="xs">
                <Text size="sm" align="center">
                    The secret link only works once, and then it will disappear.
                </Text>

                <Text size="sm" align="center">
                    <strong>Hemmelig</strong>, [he`m:(ə)li], means secret in Norwegian.
                </Text>
            </Stack>
        </Container>
    );
};

export default Home;
