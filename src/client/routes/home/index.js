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
    Collapse,
    Divider,
} from '@mantine/core';
import {
    IconSquarePlus,
    IconTrash,
    IconLock,
    IconLockAccess,
    IconLink,
    IconCopy,
    IconCheck,
    IconSettings,
} from '@tabler/icons';

import Error from '../../components/info/error';

import { getToken, hasToken } from '../../helpers/token';

import { createSecret, burnSecret } from '../../api/secret';

const Home = () => {
    const [text, setText] = useState('');

    const [ttl, setTTL] = useState(14400);
    const [password, setPassword] = useState('');
    const [enablePassword, setOnEnablePassword] = useState(false);
    const [allowedIp, setAllowedIp] = useState('');
    const [preventBurn, setPreventBurn] = useState(false);
    const [formData, setFormData] = useState(null);
    const [secretId, setSecretId] = useState('');
    const [encryptionKey, setEncryptionKey] = useState('');
    const [_, setIsLoggedIn] = useState(false);
    const [settings, setOpenSettings] = useState(false);

    const [error, setError] = useState('');
    const [secretError, setSecretError] = useState('');

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

    useEffect(() => {
        if (enablePassword) {
            setPassword(
                passwordGenerator.generate({
                    length: 12,
                    numbers: true,
                    strict: true,
                })
            );
        } else {
            setPassword('');
        }
    }, [enablePassword]);

    const onTextareChange = (event) => {
        setText(event.target.value);
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
                    onChange={onTextareChange}
                    value={text}
                    readOnly={inputReadOnly}
                    error={secretError}
                />

                <Group spacing="lg">
                    <Select
                        value={ttl}
                        onChange={onSelectChange}
                        data={[
                            { value: 604800, label: '7 days' },
                            { value: 259200, label: '3 days' },
                            { value: 86400, label: '1 day' },
                            { value: 43200, label: '12 hours' },
                            { value: 14400, label: '4 hours' },
                            { value: 3600, label: '1 hour' },
                            { value: 1800, label: '30 minutes' },
                            { value: 300, label: '5 minutes' },
                            { value: 0, label: 'Never expire' },
                        ]}
                    />

                    <Checkbox
                        checked={enablePassword}
                        onChange={onEnablePassword}
                        readOnly={inputReadOnly}
                        color="hemmelig"
                        label="Enable password"
                    />

                    <TextInput
                        icon={<IconLock />}
                        placeholder="Your optional password"
                        value={password}
                        onChange={onPasswordChange}
                        readOnly={!enablePassword || inputReadOnly}
                    />
                </Group>

                <Group>
                    <Stack>
                        <Button
                            leftIcon={<IconSettings size={14} />}
                            compact
                            variant={settings ? 'outline' : 'subtle'}
                            color="gray"
                            onClick={() => setOpenSettings((o) => !o)}
                        >
                            More options
                        </Button>

                        <Collapse
                            in={settings}
                            transitionDuration={50}
                            transitionTimingFunction="linear"
                        >
                            <Stack>
                                <TextInput
                                    icon={<IconLockAccess />}
                                    placeholder="Restrict by IP address"
                                    value={allowedIp}
                                    onChange={onIpChange}
                                    readOnly={inputReadOnly}
                                />

                                <Checkbox
                                    checked={preventBurn}
                                    onChange={onPreventBurnChange}
                                    readOnly={inputReadOnly}
                                    color="hemmelig"
                                    label="Burn the secret only after the expired date"
                                />
                            </Stack>
                        </Collapse>
                    </Stack>
                </Group>

                {secretId && (
                    <TextInput
                        icon={<IconLink />}
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
                )}

                <Group>
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
