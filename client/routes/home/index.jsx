import {
    IconAlertCircle,
    IconCheck,
    IconClock,
    IconCopy,
    IconEye,
    IconFileUpload,
    IconFlame,
    IconHeading,
    IconInfoCircle,
    IconKey,
    IconLink,
    IconLock,
    IconLockAccess,
    IconShare,
    IconShieldLock,
    IconTrash,
    IconX,
} from '@tabler/icons';
import passwordGenerator from 'generate-password-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { encrypt, generateKey } from '../../../shared/helpers/crypto';
import { burnSecret, createSecret } from '../../api/secret';
import QRLink from '../../components/qrlink';
import Quill from '../../components/quill';
import { Switch } from '../../components/switch';
import config from '../../config';
import { zipFiles } from '../../helpers/zip';

const DEFAULT_TTL = 259200; // 3 days

const Home = () => {
    const { t } = useTranslation();
    const isLoggedIn = useSelector((state) => state.isLoggedIn);

    // Main form state
    const [formData, setFormData] = useState({
        text: '',
        title: '',
        maxViews: 1,
        files: [],
        password: false,
        passwordValue: '',
        ttl: DEFAULT_TTL,
        allowedIp: '',
        preventBurn: false,
        isPublic: false,
        burnAfterReading: true, // default to true
        burnAfterTime: false,
    });

    // UI state
    const [ttl, setTTL] = useState(DEFAULT_TTL);
    const [enablePassword, setOnEnablePassword] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [creatingSecret, setCreatingSecret] = useState(false);
    const [errors, setErrors] = useState({
        banner: {
            title: '',
            message: '',
            dismissible: true,
        },
        fields: {},
        sections: {},
    });

    // Result state
    const [secretId, setSecretId] = useState('');
    const [encryptionKey, setEncryptionKey] = useState('');
    const secretRef = useRef(null);

    // Available TTL options
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

    if (isLoggedIn) {
        ttlValues.unshift(
            { value: 2419200, label: t('home.28_days') },
            { value: 1209600, label: t('home.14_days') }
        );
    }

    // Effects
    useEffect(() => {
        if (secretId) {
            secretRef.current?.focus();
        }
    }, [secretId]);

    useEffect(() => {
        if (enablePassword) {
            const newPassword = passwordGenerator.generate({
                length: 16,
                numbers: true,
                strict: true,
                symbols: true,
            });
            setFormData((prev) => ({ ...prev, password: newPassword }));
        } else {
            setFormData((prev) => ({ ...prev, password: '' }));
        }
    }, [enablePassword]);

    // Form handlers
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const onTextChange = useCallback((value) => {
        setFormData((prev) => ({ ...prev, text: value }));
    }, []); // Empty dependency array since setFormData is stable

    const onSelectChange = (value) => {
        setTTL(value);
        setFormData((prev) => ({ ...prev, ttl: value }));
    };

    // Feature toggles
    const onEnablePassword = () => setOnEnablePassword(!enablePassword);
    const onSetPublic = () => setIsPublic(!isPublic);

    // File handling
    const removeFile = (index) => {
        const updatedFiles = [...formData.files];
        updatedFiles.splice(index, 1);
        setFormData((prev) => ({ ...prev, files: updatedFiles }));
    };

    // URL and sharing
    const handleFocus = (event) => event.target.select();

    const getSecretURL = (withEncryptionKey = true) => {
        if (!withEncryptionKey) return `${window.location.origin}/secret/${secretId}`;
        return `${window.location.origin}/secret/${secretId}#encryption_key=${encryptionKey}`;
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

    // Secret management
    const onBurn = async (event) => {
        if (!secretId) return;
        event.preventDefault();
        await burnSecret(secretId);
        reset();
    };

    const reset = () => {
        setFormData({
            text: '',
            title: '',
            maxViews: 1,
            files: [],
            password: false,
            passwordValue: '',
            ttl: DEFAULT_TTL,
            allowedIp: '',
            preventBurn: false,
            isPublic: false,
            burnAfterReading: true, // default to true
            burnAfterTime: false,
        });
        setSecretId('');
        setEncryptionKey('');
        setOnEnablePassword(false);
        setCreatingSecret(false);
        setTTL(DEFAULT_TTL);
        setIsPublic(false);
        setErrors({
            banner: {
                title: '',
                message: '',
                dismissible: true,
            },
            fields: {},
            sections: {},
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear previous errors
        setErrors({
            banner: {
                title: '',
                message: '',
                dismissible: true,
            },
            fields: {},
            sections: {},
        });

        // Validate required text
        if (!formData.text) {
            setErrors({
                ...errors,
                fields: { text: t('home.please_add_secret') },
            });
            return;
        }

        setCreatingSecret(true);

        try {
            const password = formData.password;
            const publicEncryptionKey = generateKey(password);
            const encryptionKey = publicEncryptionKey + password;

            const body = {
                text: isPublic ? formData.text : encrypt(formData.text, encryptionKey),
                files: [],
                title: isPublic ? formData.title : encrypt(formData.title, encryptionKey),
                password: formData.password,
                ttl: formData.ttl,
                allowedIp: formData.allowedIp,
                preventBurn: formData.preventBurn,
                maxViews: formData.maxViews,
                isPublic: isPublic,
            };

            const zipFile = await zipFiles(formData.files);
            if (zipFile) {
                body.files.push({
                    type: 'application/zip',
                    ext: '.zip',
                    content: encrypt(zipFile, encryptionKey),
                });
            }

            const json = await createSecret(body);

            if (json.statusCode !== 201) {
                if (json.statusCode === 400) {
                    setErrors({
                        general: t('home.error_bad_request'),
                        fields: {},
                        dismissible: true,
                    });
                }

                if (json.message === 'request file too large, please check multipart config') {
                    setErrors({
                        general: '',
                        fields: { files: t('home.file_too_large') },
                        dismissible: true,
                    });
                } else {
                    setErrors({
                        general: t('home.error_generic', { message: json.message }),
                        fields: {},
                        dismissible: true,
                    });
                }
                return;
            }

            // Clear errors on success
            setErrors({
                banner: {
                    title: '',
                    message: '',
                    dismissible: true,
                },
                fields: {},
                sections: {},
            });
            setSecretId(json.id);
            setEncryptionKey(publicEncryptionKey);
        } catch (err) {
            console.error('Error creating secret:', err);
            setErrors({
                general: t('home.error_creating_secret'),
                fields: {},
                dismissible: false,
            });
        } finally {
            setCreatingSecret(false);
        }
    };

    const inputReadOnly = !!secretId;
    const disableFileUpload =
        (config.get('settings.upload_restriction') && !isLoggedIn) || isPublic;

    // Premium Error Components
    const ErrorBanner = ({ message, onDismiss }) => (
        <div
            className="relative bg-gradient-to-br from-red-950/40 to-red-900/30 
                        backdrop-blur-sm rounded-xl border border-red-500/20 
                        shadow-lg shadow-red-500/5"
        >
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 rounded-xl" />
            <div className="relative px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 p-2 bg-red-500/10 rounded-lg">
                            <IconAlertCircle className="text-red-400" size={20} />
                        </div>
                        <p className="text-sm font-medium text-red-200 truncate">{message}</p>
                    </div>
                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="flex-shrink-0 p-2 hover:bg-red-500/10 
                                     rounded-lg transition-colors duration-200"
                            aria-label={t('common.dismiss')}
                        >
                            <IconX className="text-red-400" size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    const FieldError = ({ message }) => (
        <div className="flex items-center gap-2 mt-2">
            <div className="p-1 bg-red-500/10 rounded">
                <IconAlertCircle className="text-red-400" size={12} />
            </div>
            <span className="text-xs font-medium text-red-400">{message}</span>
        </div>
    );

    // Premium Form Section Component
    const FormSection = ({ title, subtitle, children, error }) => (
        <div className="relative space-y-4">
            {title && (
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-white/90">{title}</h2>
                    {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
                </div>
            )}
            <div
                className={`
                relative overflow-hidden
                bg-gradient-to-br from-gray-800/50 to-gray-900/50
                backdrop-blur-sm
                rounded-xl
                border ${error ? 'border-red-500/20' : 'border-white/[0.08]'}
                shadow-xl shadow-black/10
            `}
            >
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
                <div className="relative p-6">{children}</div>
            </div>
            {error && <FieldError message={error} />}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Header */}
                <div className="text-center space-y-4 mb-12">
                    <h1 className="text-3xl font-bold text-white">{t('common.title')}</h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        {t('common.description')}
                    </p>
                </div>

                {errors.banner.message && (
                    <ErrorBanner
                        title={errors.banner.title}
                        message={errors.banner.message}
                        onDismiss={
                            errors.banner.dismissible
                                ? () =>
                                      setErrors((prev) => ({
                                          ...prev,
                                          banner: { title: '', message: '', dismissible: true },
                                      }))
                                : undefined
                        }
                    />
                )}

                {/* Secret Content Section */}
                <FormSection title={t('common.content')} subtitle={t('common.content_description')}>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Quill
                                value={formData.text}
                                onChange={onTextChange}
                                readOnly={inputReadOnly}
                                className={`
                                    bg-black/20 border-white/[0.08]
                                    hover:border-white/[0.12] focus:border-primary
                                    transition-colors duration-200
                                    ${errors.fields.text ? 'border-red-500/50' : ''}
                                `}
                            />
                            {errors.fields.text && <FieldError message={errors.fields.text} />}
                        </div>

                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <IconHeading size={18} />
                            </div>
                            <input
                                type="text"
                                name="title"
                                placeholder={t('home.title')}
                                value={formData.title}
                                onChange={handleInputChange}
                                readOnly={inputReadOnly}
                                className="w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-md 
                                         focus:ring-2 focus:ring-hemmelig focus:border-transparent
                                         text-base text-gray-100 placeholder-gray-500"
                            />
                            <p className="mt-2 text-sm text-gray-400">
                                {t('home.title_description')}
                            </p>
                        </div>
                    </div>
                </FormSection>

                {/* Security Options */}
                <FormSection
                    title={t('common.security')}
                    subtitle={t('common.security_description')}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <button
                                type="button"
                                onClick={onSetPublic}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3
                                    bg-black/20 rounded-lg border border-white/[0.08]
                                    hover:border-white/[0.12] transition-colors duration-200
                                    ${!isPublic ? 'text-primary border-primary/50' : 'text-gray-300'}
                                `}
                            >
                                <IconLock size={18} />
                                <span className="text-sm font-medium">
                                    {t(isPublic ? 'common.public' : 'common.private')}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={onEnablePassword}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3
                                    bg-black/20 rounded-lg border border-white/[0.08]
                                    hover:border-white/[0.12] transition-colors duration-200
                                    ${enablePassword ? 'text-primary border-primary/50' : 'text-gray-300'}
                                `}
                            >
                                <IconShieldLock size={18} />
                                <span className="text-sm font-medium">{t('common.password')}</span>
                            </button>

                            {/* Password Input Field */}
                            {enablePassword && (
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IconKey className="text-gray-400" size={14} />
                                    </div>
                                    <input
                                        type="text"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        readOnly={inputReadOnly}
                                        className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 
                                                 rounded-lg text-gray-100 placeholder-gray-500
                                                 focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder={t('common.password')}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <IconClock size={18} />
                                </div>
                                <select
                                    value={ttl}
                                    onChange={(e) => onSelectChange(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-md
                                             text-gray-100 focus:border-primary focus:ring-1 focus:ring-primary
                                             appearance-none"
                                >
                                    {ttlValues.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-2 text-sm text-gray-400">
                                    {t('home.ttl_description')}
                                </p>
                            </div>

                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <IconEye size={18} />
                                </div>
                                <input
                                    type="number"
                                    name="maxViews"
                                    value={formData.maxViews}
                                    onChange={handleInputChange}
                                    min="1"
                                    max="999"
                                    className="w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-md
                                             text-gray-100 focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                                <p className="mt-2 text-sm text-gray-400">
                                    {t('home.max_views_description')}
                                </p>
                            </div>

                            {/* Burn after reading toggle */}
                            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/[0.08]">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-orange-500/10 rounded-lg">
                                        <IconFlame className="text-orange-400" size={18} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white/90">
                                            {t('home.burn_after_reading')}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {t('home.burn_description')}
                                        </div>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.burnAfterReading}
                                    onChange={(checked) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            burnAfterReading: checked,
                                        }))
                                    }
                                >
                                    {t('home.burn_after_reading')}
                                </Switch>
                            </div>

                            {/* Optional: Burn after time toggle */}
                            {!formData.burnAfterReading && (
                                <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/[0.08]">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-orange-500/10 rounded-lg">
                                            <IconFlame className="text-orange-400" size={18} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white/90">
                                                {t('home.burn_after_time')}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {t('home.burn_aftertime')}
                                            </div>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={formData.burnAfterTime}
                                        onChange={(checked) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                burnAfterTime: checked,
                                            }))
                                        }
                                    >
                                        {t('home.burn_after_time')}
                                    </Switch>
                                </div>
                            )}
                        </div>
                    </div>
                </FormSection>

                {/* File Upload Section */}
                {!disableFileUpload && (
                    <FormSection title={t('home.file_upload')} error={errors.sections.files}>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    id="fileUpload"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        setFormData((prev) => ({
                                            ...prev,
                                            files: [...prev.files, ...files],
                                        }));
                                    }}
                                    multiple
                                    className="hidden"
                                />
                                <label
                                    htmlFor="fileUpload"
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 
                                             hover:bg-gray-700 rounded-md cursor-pointer transition-colors"
                                >
                                    <IconFileUpload size={16} />
                                    <span>{t('upload')}</span>
                                </label>
                            </div>

                            {formData.files.length > 0 && (
                                <div className="space-y-2">
                                    {formData.files.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between bg-gray-800 
                                                                          rounded-md px-3 py-2"
                                        >
                                            <span className="text-sm text-gray-300">
                                                {file.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="p-1 text-red-500 hover:bg-red-500/20 rounded-md"
                                                title={t('home.remove_file')}
                                            >
                                                <IconTrash size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </FormSection>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        type="submit"
                        disabled={creatingSecret}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 
                                 bg-hemmelig text-white rounded-md hover:bg-hemmelig-700 
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <IconLockAccess size={14} />
                        {t('create')} {/* Changed from home.create_secret */}
                    </button>

                    {secretId && (
                        <>
                            <button
                                type="button"
                                onClick={onShare}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 
                                         bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 
                                         transition-colors"
                            >
                                <IconShare size={14} />
                                {t('home.share')}
                            </button>

                            <button
                                type="button"
                                onClick={onBurn}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 
                                         bg-red-500/20 text-red-500 rounded-md hover:bg-red-500/30 
                                         transition-colors"
                            >
                                <IconTrash size={14} />
                                {t('home.burn')}
                            </button>
                        </>
                    )}
                </div>

                {/* Secret URL Display */}
                {secretId && (
                    <FormSection
                        title={t('common.secret_url')}
                        subtitle={t('common.secret_description')}
                    >
                        <div className="space-y-6">
                            {/* URL Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">
                                    {t('common.secret_url')}
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                        <IconLink size={14} />
                                    </span>
                                    <input
                                        type="text"
                                        value={getSecretURL(false)} // URL without encryption key
                                        readOnly
                                        onClick={handleFocus}
                                        className="w-full pl-10 pr-20 py-2 bg-gray-800 border border-gray-700 
                                                 rounded-md text-gray-100"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigator.clipboard.writeText(getSecretURL(false))
                                            }
                                            className="p-1 hover:bg-gray-700 rounded-md group"
                                            title={t('common.copy')}
                                        >
                                            <IconCopy
                                                size={14}
                                                className="text-gray-400 group-hover:hidden"
                                            />
                                            <IconCheck
                                                size={14}
                                                className="text-green-500 hidden group-hover:block"
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Decryption Key Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">
                                    {t('common.decryption_key')}
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                        <IconKey size={14} />
                                    </span>
                                    <input
                                        type="text"
                                        value={encryptionKey}
                                        readOnly
                                        onClick={handleFocus}
                                        className="w-full pl-10 pr-20 py-2 bg-gray-800 border border-gray-700 
                                                 rounded-md text-gray-100"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigator.clipboard.writeText(encryptionKey)
                                            }
                                            className="p-1 hover:bg-gray-700 rounded-md group"
                                            title={t('common.copy')}
                                        >
                                            <IconCopy
                                                size={14}
                                                className="text-gray-400 group-hover:hidden"
                                            />
                                            <IconCheck
                                                size={14}
                                                className="text-green-500 hidden group-hover:block"
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Info Banner */}
                            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-1 bg-primary/10 rounded">
                                        <IconInfoCircle className="text-primary" size={16} />
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-gray-300">{t('common.one_time_use')}</p>
                                        <p className="text-gray-400 text-xs">
                                            Hemmelig, [he`m:(ə)li], {t('common.norwegian_meaning')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="pt-4">
                                <QRLink value={getSecretURL()} />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={onShare}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 
                                             bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 
                                             transition-colors"
                                >
                                    <IconShare size={14} />
                                    {t('common.share')}
                                </button>

                                <button
                                    type="button"
                                    onClick={onBurn}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 
                                             bg-red-500/20 text-red-500 rounded-md hover:bg-red-500/30 
                                             transition-colors"
                                >
                                    <IconTrash size={14} />
                                    {t('common.burn')}
                                </button>
                            </div>
                        </div>
                    </FormSection>
                )}
            </form>
        </div>
    );
};

export default Home;
