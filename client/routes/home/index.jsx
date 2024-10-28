import {
    IconAlertCircle,
    IconCheck,
    IconCopy,
    IconHeading,
    IconLink,
    IconLock,
    IconLockAccess,
    IconShare,
    IconShieldLock,
    IconSquarePlus,
    IconTrash,
    IconX,
} from '@tabler/icons';
import passwordGenerator from 'generate-password-browser';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { encrypt, generateKey } from '../../../shared/helpers/crypto';
import { burnSecret, createSecret } from '../../api/secret';
import QRLink from '../../components/qrlink';
import Quill from '../../components/quill';
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
        password: '',
        ttl: DEFAULT_TTL,
        allowedIp: '',
        preventBurn: false,
        isPublic: false,
    });

    // UI state
    const [text, setText] = useState('');
    const [ttl, setTTL] = useState(DEFAULT_TTL);
    const [enablePassword, setOnEnablePassword] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [creatingSecret, setCreatingSecret] = useState(false);
    const [errors, setErrors] = useState({
        general: '',
        fields: {},
        dismissible: true,
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

    const onTextChange = (value) => {
        setText(value);
        setFormData((prev) => ({ ...prev, text: value }));
    };

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
            password: '',
            ttl: DEFAULT_TTL,
            allowedIp: '',
            preventBurn: false,
            isPublic: false,
        });
        setSecretId('');
        setEncryptionKey('');
        setOnEnablePassword(false);
        setCreatingSecret(false);
        setText('');
        setTTL(DEFAULT_TTL);
        setIsPublic(false);
        setErrors({ general: '', fields: {}, dismissible: true });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear previous errors
        setErrors({ general: '', fields: {}, dismissible: true });

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
            setErrors({ general: '', fields: {}, dismissible: true });
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

    // Add this new component for better error display
    const ErrorMessage = ({ message, onDismiss }) => (
        <div
            className="relative flex items-center gap-3 bg-red-500/10 border border-red-500/20 
                        text-red-500 rounded-lg p-4 animate-fadeIn"
        >
            <IconAlertCircle className="flex-shrink-0" size={20} />
            <p className="text-sm font-medium pr-8">{message}</p>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-red-500/20 
                             rounded-full transition-colors"
                >
                    <IconX size={16} />
                </button>
            )}
        </div>
    );

    // Add this new component for form field errors
    const FieldError = ({ message }) => (
        <div className="flex items-center gap-2 mt-1.5 text-red-500">
            <IconAlertCircle size={14} />
            <span className="text-xs font-medium">{message}</span>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 font-sans">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Section */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold text-white">{t('home.app_subtitle')}</h1>
                    <p className="text-base text-gray-400">{t('home.welcome')}</p>
                </div>

                {/* General Error Display */}
                {errors.general && (
                    <ErrorMessage
                        message={errors.general}
                        onDismiss={
                            errors.dismissible
                                ? () => setErrors({ ...errors, general: '' })
                                : undefined
                        }
                    />
                )}

                {/* Main Content Section */}
                <div className="space-y-6 bg-gray-800/50 p-6 rounded-lg">
                    {/* Editor with inline error */}
                    <div className="space-y-2">
                        <Quill
                            defaultValue={t('home.maintxtarea')}
                            value={text}
                            onChange={onTextChange}
                            readOnly={inputReadOnly}
                            secretId={secretId}
                            className={errors.fields.text ? 'border-red-500' : ''}
                        />
                        {errors.fields.text && <FieldError message={errors.fields.text} />}
                    </div>

                    {/* Title */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <IconHeading size={14} />
                        </span>
                        <input
                            type="text"
                            name="title"
                            placeholder={t('home.title')}
                            value={formData.title}
                            onChange={handleInputChange}
                            readOnly={inputReadOnly}
                            className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md 
                                     focus:ring-2 focus:ring-hemmelig focus:border-transparent
                                     text-base text-gray-100 placeholder-gray-500"
                        />
                    </div>

                    {/* Settings Section */}
                    <div className="space-y-6 bg-gray-800/50 p-6 rounded-lg">
                        <h2 className="text-lg font-semibold text-white">{t('settings')}</h2>

                        {/* TTL and Max Views */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    {t('ttl')} {/* Changed from home.time_to_live */}
                                </label>
                                <select
                                    value={ttl}
                                    onChange={(e) => onSelectChange(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 
                                             focus:ring-2 focus:ring-hemmelig focus:border-transparent
                                             text-gray-100"
                                >
                                    {ttlValues.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    {t('home.max_views')}
                                </label>
                                <input
                                    type="number"
                                    name="maxViews"
                                    value={formData.maxViews}
                                    onChange={handleInputChange}
                                    min="1"
                                    max="999"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 
                                             focus:ring-2 focus:ring-hemmelig focus:border-transparent
                                             text-gray-100"
                                />
                            </div>
                        </div>

                        {/* Security Options */}
                        <div className="space-y-4">
                            {/* Public/Private Toggle */}
                            <button
                                type="button"
                                onClick={onSetPublic}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors
                                    ${
                                        isPublic
                                            ? 'bg-hemmelig text-white'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                <IconLock size={14} />
                                {isPublic ? t('public') : t('private')}{' '}
                                {/* Changed from home.private */}
                            </button>

                            {/* Password Protection */}
                            <button
                                type="button"
                                onClick={onEnablePassword}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors
                                    ${
                                        enablePassword
                                            ? 'bg-hemmelig text-white'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                <IconLock size={14} />
                                {t('password')} {/* Changed from home.password_protection */}
                            </button>

                            {enablePassword && (
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                        <IconShieldLock size={14} />
                                    </span>
                                    <input
                                        type="text"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        readOnly
                                        className="w-full pl-10 pr-20 py-2 bg-gray-800 border border-gray-700 rounded-md 
                                                 focus:ring-2 focus:ring-hemmelig focus:border-transparent
                                                 text-gray-100"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigator.clipboard.writeText(formData.password)
                                            }
                                            className="p-1 hover:bg-gray-700 rounded-md group"
                                            title={t('home.copy_to_clipboard')}
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
                            )}
                        </div>

                        {/* Advanced Options */}
                        <div className="space-y-4">
                            {/* IP Restriction */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    {t('ip')} {/* Changed from home.ip_restriction */}
                                </label>
                                <input
                                    type="text"
                                    name="allowedIp"
                                    value={formData.allowedIp}
                                    onChange={handleInputChange}
                                    placeholder="127.0.0.1, 192.168.1.*"
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md 
                                             focus:ring-2 focus:ring-hemmelig focus:border-transparent
                                             text-gray-100 placeholder-gray-500"
                                />
                            </div>

                            {/* Prevent Burn Option */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="preventBurn"
                                    name="preventBurn"
                                    checked={formData.preventBurn}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-hemmelig bg-gray-800 border-gray-700 rounded 
                                             focus:ring-hemmelig focus:ring-2"
                                />
                                <label htmlFor="preventBurn" className="text-sm text-gray-300">
                                    {t('prevent_burn')} {/* Changed from home.prevent_burn */}
                                </label>
                            </div>
                        </div>

                        {/* File Upload */}
                        {!disableFileUpload && (
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
                                        <IconSquarePlus size={14} />
                                        {t('upload')} {/* Changed from home.upload_file */}
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
                        )}
                    </div>

                    {/* Display file-specific errors */}
                    {errors.fields.files && (
                        <div className="text-red-500 text-sm mt-2">{errors.fields.files}</div>
                    )}
                </div>

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
                    <div className="space-y-4 bg-gray-800/50 p-6 rounded-lg">
                        <h2 className="text-lg font-semibold text-white">{t('home.secret_url')}</h2>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <IconLink size={14} />
                            </span>
                            <input
                                ref={secretRef}
                                type="text"
                                value={getSecretURL()}
                                readOnly
                                onClick={handleFocus}
                                className="w-full pl-10 pr-20 py-2 bg-gray-800 border border-gray-700 
                                         rounded-md text-gray-100"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(getSecretURL())}
                                    className="p-1 hover:bg-gray-700 rounded-md group"
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

                        <QRLink value={getSecretURL()} />
                    </div>
                )}
            </form>
        </div>
    );
};

export default Home;
