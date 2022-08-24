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
} from '@tabler/icons';
import { useSelector } from 'react-redux';

import config from '../../config';

import Error from '../../components/info/error';

import { getToken } from '../../helpers/token';

import { createSecret, burnSecret } from '../../api/secret';

const Home = () => {
    const [text, setText] = useState('');
    const [title, setTitle] = useState('');
    const [enableFileUpload] = useState(config.get('settings.enableFileUpload', false));
    const [file, setFile] = useState(null);
    const [ttl, setTTL] = useState(14400);
    const [password, setPassword] = useState('');
    const [enablePassword, setOnEnablePassword] = useState(false);
    const [allowedIp, setAllowedIp] = useState('');
    const [preventBurn, setPreventBurn] = useState(false);
    const [formData, setFormData] = useState(new FormData());
    const [secretId, setSecretId] = useState('');
    const [encryptionKey, setEncryptionKey] = useState('');

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
        setFile('');
        setTitle('');
        setPreventBurn(false);
        setFormData(new FormData());
    };

    const onSubmit = async (event) => {
        if (!text) {
            setSecretError('Please add a secret.');

            return;
        }

        event.preventDefault();

        formData.append('text', text);
        formData.append('file', file);
        formData.append('title', title);
        formData.append('password', password);
        formData.append('ttl', ttl);
        formData.append('allowedIp', allowedIp);
        formData.append('preventBurn', preventBurn);

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
                        icon={<IconHeading size={14} />}
                        placeholder="Title"
                        value={title}
                        onChange={onTitleChange}
                        readOnly={inputReadOnly}
                    />

                    <Select value={ttl} onChange={onSelectChange} data={ttlValues} />
                </Group>

                <Group grow>
                    <Checkbox
                        checked={enablePassword}
                        onChange={onEnablePassword}
                        readOnly={inputReadOnly}
                        color="hemmelig"
                        label="Enable password"
                    />

                    <TextInput
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
                        checked={preventBurn}
                        onChange={onPreventBurnChange}
                        readOnly={inputReadOnly}
                        color="hemmelig"
                        label="Burn the secret only after the time expires"
                    />

                    <TextInput
                        icon={<IconLockAccess size={14} />}
                        placeholder="Restrict by IP address"
                        value={allowedIp}
                        onChange={onIpChange}
                        readOnly={inputReadOnly}
                    />
                </Group>

                <Group>
                    {enableFileUpload && (
                        <FileButton
                            onChange={setFile}
                            accept="image/*,text/*,application/*"
                            disabled={!isLoggedIn}
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
                                    Upload file
                                </Button>
                            )}
                        </FileButton>
                    )}

                    {enableFileUpload && !isLoggedIn && (
                        <Text size="sm" align="center" mt="sm">
                            Sign in to upload files
                        </Text>
                    )}

                    {file && (
                        <Text size="sm" align="center" mt="sm">
                            Picked file: {file.name}
                        </Text>
                    )}
                </Group>

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
                            Create a new secret
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
                            Burn the secret
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
