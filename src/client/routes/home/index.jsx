import React, { useEffect, useState, useRef } from 'react';
import passwordGenerator from 'generate-password-browser';
import {
    Button,
    Checkbox,
    Container,
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
    Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
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
    IconShieldLock,
} from '@tabler/icons';
import { useSelector } from 'react-redux';
import Quill from '../../components/quill';
import QRLink from '../../components/qrlink';
import ErrorBox from '../../components/error-box';

import { zipFiles } from '../../helpers/zip';
import { createSecret, burnSecret } from '../../api/secret';
import { generateKey, encrypt } from '../../../shared/helpers/crypto';
import { useTranslation } from 'react-i18next';

import config from '../../config';

import style from './style.module.css';

const DEFAULT_TTL = 259200; // 3 days - 72 hours

const Home = () => {
    const form = useForm({
        initialValues: {
            text: '',
            title: '',
            maxViews: 1,
            files: [],
            password: '',
            ttl: DEFAULT_TTL,
            allowedIp: '',
            preventBurn: false,
        },
    });

    const [text, setText] = useState('');
    const [ttl, setTTL] = useState(DEFAULT_TTL);
    const [enablePassword, setOnEnablePassword] = useState(false);
    const [secretId, setSecretId] = useState('');
    const [encryptionKey, setEncryptionKey] = useState('');
    const [creatingSecret, setCreatingSecret] = useState(false);
    const [error, setError] = useState('');

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
            form.setFieldValue(
                'password',
                passwordGenerator.generate({
                    length: 16,
                    numbers: true,
                    strict: true,
                    symbols: true,
                })
            );
        } else {
            form.setFieldValue('password', '');
        }
    }, [enablePassword]);

    const onTextChange = (value) => {
        setText(value);

        form.setFieldValue('text', value);
    };

    const onSelectChange = (value) => {
        form.setFieldValue('ttl', value);
        setTTL(value);
    };

    const onEnablePassword = () => {
        setOnEnablePassword(!enablePassword);
    };

    const reset = () => {
        form.reset();
        setSecretId('');
        form.clearErrors();
        setEncryptionKey('');
        setOnEnablePassword(false);
        setCreatingSecret(false);
        setText('');
        setTTL(DEFAULT_TTL);
        setError('');
    };

    const onSubmit = async (values) => {
        if (!form.values.text) {
            form.setErrors({ text: t('home.please_add_secret') });
            return;
        }

        const password = form.values.password;

        const publicEncryptionKey = generateKey(password);
        const encryptionKey = publicEncryptionKey + password;

        setCreatingSecret(true);

        const body = {
            text: encrypt(form.values.text, encryptionKey),
            files: [],
            title: encrypt(form.values.title, encryptionKey),
            password: form.values.password,
            ttl: form.values.ttl,
            allowedIp: form.values.allowedIp,
            preventBurn: form.values.preventBurn,
            maxViews: form.values.maxViews,
        };

        const zipFile = await zipFiles(form.values.files);

        if (zipFile) {
            body.files.push({
                type: 'application/zip',
                ext: '.zip',
                content: encrypt(zipFile, encryptionKey),
            });
        }

        const json = await createSecret(body);

        if (json.statusCode !== 201) {
            if (json.statusCode === 403) {
                setError(json.error);
            }

            if (json.message === 'request file too large, please check multipart config') {
                form.setErrors({ files: 'The file size is too large' });
            } else {
                form.setErrors({ files: json.error });
            }

            setCreatingSecret(false);

            return;
        }

        setSecretId(json.id);
        setEncryptionKey(publicEncryptionKey);
        form.clearErrors();
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

    const removeFile = (index) => {
        const updatedFiles = [...form.values.files];
        updatedFiles.splice(index, 1);
        form.setFieldValue('files', updatedFiles);
    };

    const handleFocus = (event) => event.target.select();

    const getSecretURL = (withEncryptionKey = true) => {
        if (!withEncryptionKey) {
            return `${window.location.origin}/secret/${secretId}`;
        }

        return `${window.location.origin}/secret/${secretId}#encryption_key=${encryptionKey}`;
    };

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
            <form
                onSubmit={form.onSubmit((values) => {
                    onSubmit(values);
                })}
            >
                <Stack>
                    <Title order={1} size="h2" align="center">
                        {t('home.app_subtitle')}
                    </Title>
                    <Text size="sm" align="center">
                        {t('home.welcome')}
                    </Text>

                    {error && <ErrorBox message={error} />}

                    <Quill
                        defaultValue={t('home.maintxtarea')}
                        value={text}
                        onChange={onTextChange}
                        readOnly={inputReadOnly}
                        secretId={secretId}
                    />

                    <Group grow>
                        <TextInput
                            styles={groupMobileStyle}
                            icon={<IconHeading size={14} />}
                            placeholder={t('home.title')}
                            readOnly={inputReadOnly}
                            {...form.getInputProps('title')}
                        />
                    </Group>

                    <Group grow>
                        <Select
                            zIndex={9999}
                            value={ttl}
                            onChange={onSelectChange}
                            data={ttlValues}
                            label={t('home.lifetime')}
                        />

                        <NumberInput
                            defaultValue={1}
                            min={1}
                            max={999}
                            placeholder="1"
                            label={t('home.max_views')}
                            {...form.getInputProps('maxViews')}
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
                            minLength="8"
                            maxLength="28"
                            {...form.getInputProps('password')}
                            readOnly={!enablePassword || inputReadOnly}
                            rightSection={
                                <CopyButton value={form.values.password} timeout={2000}>
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

                    <Group grow>
                        <Checkbox
                            styles={groupMobileStyle}
                            readOnly={inputReadOnly}
                            color="hemmelig"
                            label={t('home.burn_aftertime')}
                            {...form.getInputProps('preventBurn')}
                        />

                        <Tooltip label={t('home.restrict_from_ip')}>
                            <TextInput
                                styles={groupMobileStyle}
                                icon={<IconLockAccess size={14} />}
                                placeholder={t('home.restrict_from_ip_placeholder')}
                                readOnly={inputReadOnly}
                                {...form.getInputProps('allowedIp')}
                            />
                        </Tooltip>
                    </Group>

                    <Group grow={isMobile}>
                        <FileButton
                            disabled={config.get('settings.upload_restriction') && !isLoggedIn}
                            styles={groupMobileStyle}
                            multiple
                            {...form.getInputProps('files')}
                        >
                            {(props) => (
                                <Button
                                    {...props}
                                    label={
                                        config.get('settings.upload_restriction') && !isLoggedIn
                                            ? t('home.upload_files')
                                            : ''
                                    }
                                    color={
                                        config.get('settings.upload_restriction') && !isLoggedIn
                                            ? 'gray'
                                            : 'hemmelig-orange'
                                    }
                                >
                                    {t('home.upload_files')}
                                </Button>
                            )}
                        </FileButton>

                        {config.get('settings.upload_restriction') && !isLoggedIn && (
                            <Text size="sm" align="center" mt="sm">
                                {t('home.login_to_upload')}
                            </Text>
                        )}
                    </Group>

                    {form.values.files?.length > 0 && (
                        <Group>
                            {form.values.files.map((file, index) => (
                                <Badge
                                    className={style['file-badge']}
                                    color="orange"
                                    key={file.name}
                                >
                                    <Badge
                                        className={style['file-remove']}
                                        onClick={() => removeFile(index)}
                                    >
                                        &times;
                                    </Badge>
                                    {file.name}
                                </Badge>
                            ))}
                        </Group>
                    )}

                    {secretId && (
                        <>
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

                            <QRLink value={getSecretURL()} />

                            <Divider
                                my="xs"
                                variant="dashed"
                                labelPosition="center"
                                label={
                                    <Box ml={5}>
                                        {t('home.or', 'Separate the link and decryption key')}
                                    </Box>
                                }
                            />

                            <Group grow>
                                <TextInput
                                    label={t(
                                        'home.secret_url',
                                        'Secret URL without decryption key'
                                    )}
                                    icon={<IconLink size={14} />}
                                    value={getSecretURL(false)}
                                    onFocus={handleFocus}
                                    styles={groupMobileStyle}
                                    readOnly
                                    rightSection={
                                        <CopyButton value={getSecretURL(false)} timeout={2000}>
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

                                <TextInput
                                    label={t('home.decryption_key', 'Decryption key')}
                                    icon={<IconShieldLock size={14} />}
                                    value={encryptionKey}
                                    onFocus={handleFocus}
                                    styles={groupMobileStyle}
                                    readOnly
                                    rightSection={
                                        <CopyButton value={encryptionKey} timeout={2000}>
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
                        </>
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
                                color="hemmelig"
                                leftIcon={<IconSquarePlus size={14} />}
                                loading={creatingSecret}
                                type="submit"
                            >
                                {t('home.create_secret_link')}
                            </Button>
                        )}

                        {secretId && (
                            <Button
                                color="hemmelig"
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
            </form>

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
