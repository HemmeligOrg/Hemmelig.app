import {
    IconAlertCircle,
    IconClock,
    IconEye,
    IconFileUpload,
    IconFlame,
    IconHeading,
    IconKey,
    IconLink,
    IconLock,
    IconLockAccess,
    IconLockOpen,
    IconNetwork,
    IconShare,
    IconShieldLock,
    IconTrash,
    IconX,
} from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { burnSecret } from '../../api/secret';
import CopyButton from '../../components/CopyButton';
import Editor from '../../components/editor';
import QRLink from '../../components/qrlink';
import { Switch } from '../../components/switch';
import config from '../../config';
import useAuthStore from '../../stores/authStore';
import useSecretStore from '../../stores/secretStore';
import useSettingsStore from '../../stores/settingsStore';

const Home = () => {
    const { t } = useTranslation();
    const { isLoggedIn } = useAuthStore();
    const { settings } = useSettingsStore();
    const [isDragging, setIsDragging] = useState(false);

    const {
        formData,
        enablePassword,
        isPublic,
        creatingSecret,
        errors,
        secretId,
        encryptionKey,
        reset,
        removeFile,
        handleSubmit,
        onEnablePassword,
        setField,
    } = useSecretStore();

    const [enableIpRange, setEnableIpRange] = useState(false);
    const inputReadOnly = !!secretId;

    const onSubmit = (event) => {
        handleSubmit(event, t);

        // Scroll to bottom of page after form submission
        // Ensure the UI has time to update before scrolling
        setTimeout(() => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth',
            });
        }, 300);
    };

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

    const onSetPublic = (event) => {
        event.preventDefault();

        setField('isPublic', !isPublic);
    };

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

    const onBurn = async (event) => {
        if (!secretId) return;
        event.preventDefault();
        await burnSecret(secretId);
        reset();
    };

    const disableFileUpload =
        (config.get('settings.upload_restriction') && !isLoggedIn) ||
        isPublic ||
        settings.disable_file_upload;

    const dismissError = () => {
        setField('errors.banner.title', '');
        setField('errors.banner.message', '');
        setField('errors.banner.dismissible', true);
    };

    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                setField('formData.files', [...formData.files, ...files]);
            }
        },
        [formData.files, setField]
    );

    const isTextEmpty = () => formData.text.trim() === '';

    const handleIpRangeToggle = (event) => {
        event.preventDefault();

        setEnableIpRange(!enableIpRange);
    };

    const handleEnablePassword = (event) => {
        event.preventDefault();

        onEnablePassword();
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-3xl font-bold text-white">{t('home.title')}</h1>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">{t('home.description')}</p>
            </div>

            {errors.banner.message && (
                <ErrorBanner
                    title={errors.banner.title}
                    message={errors.banner.message}
                    onDismiss={errors.banner.dismissible ? dismissError : undefined}
                />
            )}

            <FormSection>
                <div className="space-y-6">
                    <div className="space-y-2">
                        {inputReadOnly ? (
                            <Editor
                                key={`ro-${secretId}`}
                                content={formData.text}
                                editable={false}
                            />
                        ) : (
                            <Editor
                                key={`edit-${secretId}`}
                                name="text"
                                content={formData.text}
                                setContent={(value) => setField('formData.text', value)}
                                editable={true}
                            />
                        )}
                        {errors.fields.text && <FieldError message={errors.fields.text} />}
                    </div>

                    <div className="relative">
                        <div className="absolute left-3 top-[13px] text-gray-400 pointer-events-none">
                            <IconHeading size={18} />
                        </div>
                        <input
                            type="text"
                            name="title"
                            placeholder={t('home.content_title')}
                            value={formData.title}
                            onChange={(e) => setField('formData.title', e.target.value)}
                            readOnly={inputReadOnly}
                            className="w-full pl-10 pr-3 py-2.5 bg-gray-900 border border-gray-700 rounded-md
                                         focus:ring-2 focus:ring-hemmelig focus:border-transparent
                                         text-base text-gray-100 placeholder-gray-500"
                        />
                        <p className="mt-2 text-sm text-gray-400">{t('home.title_description')}</p>
                    </div>

                    {!disableFileUpload && (
                        <div className="space-y-4">
                            <div
                                onDragEnter={handleDragEnter}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`
                                            relative flex flex-col items-center justify-center p-8
                                            border-2 border-dashed rounded-lg transition-all duration-200
                                            ${
                                                isDragging
                                                    ? 'border-primary bg-primary/10 scale-[1.01] shadow-lg shadow-primary/5'
                                                    : 'border-white/[0.08] hover:border-white/[0.15] bg-black/20 hover:bg-black/30'
                                            }
                                            ${inputReadOnly ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                            >
                                <div
                                    className={`
                                            p-4 rounded-full mb-3 transition-all duration-200
                                            ${isDragging ? 'bg-primary/10' : 'bg-white/[0.02]'}
                                        `}
                                >
                                    <IconFileUpload
                                        size={24}
                                        className={`transition-colors duration-200 ${isDragging ? 'text-primary' : 'text-gray-400'}`}
                                    />
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <input
                                        type="file"
                                        id="fileUpload"
                                        onChange={(e) => {
                                            if (inputReadOnly) return;
                                            const files = Array.from(e.target.files || []);
                                            setField('formData.files', [
                                                ...formData.files,
                                                ...files,
                                            ]);
                                        }}
                                        disabled={inputReadOnly}
                                        multiple
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="fileUpload"
                                        className={`flex items-center gap-2 px-4 py-2 
                                                    bg-gray-800/80 text-gray-300 font-medium
                                                    rounded-md transition-all duration-200
                                                    ${
                                                        inputReadOnly
                                                            ? 'opacity-50 cursor-not-allowed'
                                                            : 'hover:bg-gray-700 cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
                                                    }`}
                                    >
                                        <IconFileUpload size={16} />
                                        <span>{t('home.upload_files')}</span>
                                    </label>
                                    <p className="text-sm text-gray-400">
                                        {!inputReadOnly && t('home.drag_and_drop')}
                                    </p>
                                </div>
                            </div>

                            {formData.files.length > 0 && (
                                <div className="space-y-2">
                                    {formData.files.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between 
                                                        bg-gradient-to-r from-gray-800/90 to-gray-800/70
                                                        backdrop-blur-sm rounded-md px-4 py-3
                                                        border border-white/[0.05] hover:border-white/[0.08]
                                                        transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-2 bg-white/[0.05] rounded-lg">
                                                    <IconFileUpload
                                                        size={14}
                                                        className="text-gray-400"
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-300 truncate">
                                                    {file.name}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                disabled={inputReadOnly}
                                                className={`p-2 rounded-lg transition-all duration-200
                                                            ${
                                                                inputReadOnly
                                                                    ? 'text-gray-500 cursor-not-allowed'
                                                                    : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                                                            }`}
                                                title={
                                                    inputReadOnly
                                                        ? t('home.cannot_remove_readonly')
                                                        : t('home.remove_file')
                                                }
                                            >
                                                <IconTrash size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {disableFileUpload && (
                        <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/[0.08]">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <IconFileUpload className="text-primary" size={18} />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white/90">
                                        {t('home.login_to_upload')}
                                    </div>
                                </div>
                            </div>
                            <Link
                                to="/signin"
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors"
                            >
                                {t('home.sign_in')}
                            </Link>
                        </div>
                    )}
                </div>
            </FormSection>

            <FormSection title={t('home.security')} subtitle={t('home.security_description')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <button
                                type="button"
                                onClick={onSetPublic}
                                disabled={inputReadOnly}
                                className={`
                                        w-full flex items-start gap-4 px-4 py-3.5
                                        bg-black/20 rounded-lg border
                                        ${inputReadOnly ? 'cursor-not-allowed opacity-80' : 'hover:border-white/[0.12]'} 
                                        transition-all duration-200
                                        ${!isPublic ? 'text-primary border-primary/50' : 'text-gray-300 border-white/[0.08]'}
                                    `}
                            >
                                <div className="p-2.5 bg-black/20 rounded-lg shrink-0">
                                    {isPublic ? <IconLockOpen size={22} /> : <IconLock size={22} />}
                                </div>
                                <div className="flex flex-col items-start min-w-0">
                                    <span className="text-sm font-medium mb-0.5">
                                        {t(isPublic ? 'home.public' : 'home.private')}
                                    </span>
                                    <span className="text-xs text-gray-400 text-left">
                                        {isPublic
                                            ? t('home.public_description')
                                            : t('home.private_description')}
                                    </span>
                                </div>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div
                                className={`
                                    w-full space-y-4 bg-black/20 rounded-lg border
                                    ${inputReadOnly ? 'opacity-80' : 'hover:border-white/[0.12]'} 
                                    transition-all duration-200
                                    ${enablePassword ? 'text-primary border-primary/50' : 'text-gray-300 border-white/[0.08]'}
                                `}
                            >
                                <button
                                    type="button"
                                    onClick={handleEnablePassword}
                                    disabled={inputReadOnly}
                                    className={`w-full flex items-start gap-4 px-4 py-3.5 ${inputReadOnly ? 'cursor-not-allowed' : ''}`}
                                >
                                    <div className="p-2.5 bg-black/20 rounded-lg shrink-0">
                                        <IconShieldLock size={22} />
                                    </div>
                                    <div className="flex flex-col items-start min-w-0">
                                        <span className="text-sm font-medium mb-0.5">
                                            {t('home.password')}
                                        </span>
                                        <span className="text-xs text-left text-gray-400 line-clamp-2">
                                            {t(
                                                'home.password_description',
                                                'Add an additional layer of security with a password'
                                            )}
                                        </span>
                                    </div>
                                </button>

                                {enablePassword && (
                                    <div className="px-4 pb-4">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <IconKey className="text-gray-400" size={14} />
                                            </div>
                                            <input
                                                type="text"
                                                name="password"
                                                value={formData.password}
                                                onChange={(e) => {
                                                    e.preventDefault();
                                                    setField('formData.password', e.target.value);
                                                }}
                                                readOnly={inputReadOnly}
                                                className="w-full pl-10 pr-10 py-3 text-sm bg-black/20 border border-white/[0.08]
                                                             rounded-lg text-gray-100 placeholder-gray-500
                                                             hover:border-white/[0.12] focus:border-primary focus:ring-1 
                                                             focus:ring-primary/50 transition-all duration-200"
                                                placeholder={t('home.password')}
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                <CopyButton textToCopy={formData.password} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {!settings.hide_allowed_ip_input && (
                            <div className="space-y-4">
                                <div
                                    className={`
                                        w-full space-y-4 bg-black/20 rounded-lg border
                                        ${inputReadOnly ? 'opacity-80' : 'hover:border-white/[0.12]'} 
                                        transition-all duration-200
                                        ${enableIpRange ? 'text-primary border-primary/50' : 'text-gray-300 border-white/[0.08]'}
                                    `}
                                >
                                    <button
                                        type="button"
                                        onClick={handleIpRangeToggle}
                                        disabled={inputReadOnly}
                                        className={`w-full flex items-start gap-4 px-4 py-3.5 ${inputReadOnly ? 'cursor-not-allowed' : ''}`}
                                    >
                                        <div className="p-2.5 bg-black/20 rounded-lg shrink-0">
                                            <IconNetwork size={22} />
                                        </div>
                                        <div className="flex flex-col items-start min-w-0">
                                            <span className="text-sm font-medium mb-0.5">
                                                {t('home.restrict_from_ip_placeholder')}
                                            </span>
                                            <span className="text-xs text-left text-gray-400">
                                                {t('home.restrict_from_ip')}
                                            </span>
                                        </div>
                                    </button>

                                    {enableIpRange && (
                                        <div className="px-4 pb-4">
                                            <div className="relative">
                                                <div className="absolute left-3 top-[14px] text-gray-400 pointer-events-none">
                                                    <IconNetwork size={18} />
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="text"
                                                        name="allowedIp"
                                                        placeholder="0.0.0.0/0"
                                                        value={formData.allowedIp}
                                                        onChange={(e) => {
                                                            e.preventDefault();
                                                            setField(
                                                                'formData.allowedIp',
                                                                e.target.value
                                                            );
                                                        }}
                                                        readOnly={inputReadOnly}
                                                        className="w-full pl-10 pr-3 text-sm py-3 bg-black/20 border border-white/[0.08]
                                                                     rounded-lg text-gray-100 placeholder-gray-500
                                                                     hover:border-white/[0.12] focus:border-primary focus:ring-1
                                                                     focus:ring-primary/50 transition-all duration-200"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="relative">
                                <div className="absolute left-3 top-[14px] text-gray-400 pointer-events-none">
                                    <IconClock size={18} />
                                </div>
                                <select
                                    value={formData.ttl}
                                    disabled={inputReadOnly}
                                    onChange={(e) => setField('formData.ttl', e.target.value)}
                                    className={`w-full pl-10 pr-8 py-3 text-sm bg-black/20 border border-white/[0.08]
                                                 rounded-lg text-gray-100 placeholder-gray-500
                                                 hover:border-white/[0.12] focus:border-primary focus:ring-1
                                                 focus:ring-primary/50 transition-all duration-200
                                                 appearance-none ${inputReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} [&>option]:bg-gray-800 [&>option]:text-gray-100`}
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.5em 1.5em',
                                    }}
                                >
                                    {ttlValues.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs text-gray-400 pl-1">
                                {t('home.ttl_description')}
                            </p>
                        </div>

                        {!formData.preventBurn && (
                            <div
                                className={`p-4 bg-black/20 rounded-lg border border-white/[0.08] space-y-4 ${inputReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <IconEye className="text-primary" size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-white/90">
                                                {t('home.max_views')}
                                            </span>
                                            <div className="group relative">
                                                <div className="p-1 bg-gray-700/50 rounded-full hover:bg-gray-700 transition-colors cursor-help">
                                                    <IconAlertCircle
                                                        size={12}
                                                        className="text-gray-400"
                                                    />
                                                </div>
                                                <span
                                                    className="absolute left-1/2 -translate-x-1/2 -translate-y-full -top-2
                                                                   px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded
                                                                   opacity-0 group-hover:opacity-100 transition-opacity
                                                                   whitespace-normal min-w-[150px] pointer-events-none z-10"
                                                >
                                                    {t('home.max_views_description')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {formData.maxViews} {t('home.views')}
                                        </div>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    value={formData.maxViews}
                                    onChange={(e) =>
                                        setField('formData.maxViews', parseInt(e.target.value))
                                    }
                                    disabled={inputReadOnly}
                                    className={`w-full h-2 bg-gray-700 rounded-lg appearance-none 
                                        ${inputReadOnly ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} 
                                        accent-primary focus:outline-none focus:ring-2 focus:ring-primary/50`}
                                />
                            </div>
                        )}

                        <div className="p-4 bg-black/20 rounded-lg border border-white/[0.08]">
                            <div
                                className={`flex items-center justify-between gap-4 ${inputReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
                            >
                                <div className="flex items-center gap-3">
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
                                    checked={formData.preventBurn}
                                    onChange={(checked) =>
                                        setField('formData.preventBurn', checked)
                                    }
                                    disabled={inputReadOnly}
                                >
                                    {t('home.burn_after_time')}
                                </Switch>
                            </div>
                        </div>
                    </div>
                </div>
            </FormSection>

            <div className="flex flex-col sm:flex-row gap-4">
                {!secretId && (
                    <button
                        type="submit"
                        disabled={
                            creatingSecret || isTextEmpty() || (settings.read_only && !isLoggedIn)
                        }
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 
                                     bg-hemmelig text-white rounded-md hover:bg-hemmelig-700 
                                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                                     group relative"
                        title={isTextEmpty() ? t('home.text_required') : ''}
                        onClick={onSubmit}
                    >
                        {creatingSecret ? (
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-b-transparent mr-2" />
                        ) : (
                            <>
                                <IconLockAccess size={14} />
                                {t('home.create')}
                            </>
                        )}
                        {isTextEmpty() && (
                            <span
                                className="absolute -top-10 left-1/2 transform -translate-x-1/2 
                                       px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded
                                       opacity-0 group-hover:opacity-100 transition-opacity
                                       whitespace-nowrap pointer-events-none"
                            >
                                {t('home.text_required')}
                            </span>
                        )}
                    </button>
                )}
            </div>

            {secretId && (
                <>
                    <FormSection
                        title={t('home.secret_url')}
                        subtitle={t('home.secret_description')}
                    >
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">
                                    {t('home.secret_url')}
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                        <IconLink size={14} />
                                    </span>
                                    <input
                                        type="text"
                                        value={getSecretURL(false)}
                                        readOnly
                                        onClick={handleFocus}
                                        className="w-full pl-10 pr-20 py-2 bg-gray-800 border border-gray-700 
                                                     rounded-md text-gray-100 focus:ring-hemmelig focus:border-hemmelig"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                        <CopyButton textToCopy={getSecretURL(false)} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">
                                    {t('home.decryption_key')}
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
                                                     rounded-md text-gray-100 focus:ring-hemmelig focus:border-hemmelig"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                        <CopyButton textToCopy={encryptionKey} />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <QRLink value={getSecretURL()} />
                            </div>
                        </div>
                    </FormSection>

                    <FormSection
                        title={t('home.complete_url')}
                        subtitle={t('home.complete_url_description')}
                    >
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                        <IconLink size={14} />
                                    </span>
                                    <input
                                        type="text"
                                        value={getSecretURL(true)}
                                        readOnly
                                        onClick={handleFocus}
                                        className="w-full pl-10 pr-20 py-2 bg-gray-800 border border-gray-700 
                                                     rounded-md text-gray-100 focus:ring-hemmelig focus:border-hemmelig"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                        <CopyButton textToCopy={getSecretURL(true)} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
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
                                    onClick={(e) => {
                                        e.preventDefault();
                                        reset();
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 
                                                 bg-hemmelig text-white rounded-md hover:bg-hemmelig-700 
                                                 transition-colors"
                                >
                                    <IconLockAccess size={14} />
                                    {t('home.create_new')}
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
                            </div>
                        </div>
                    </FormSection>
                </>
            )}

            <p className="text-gray-400 text-xs text-center pt-6">
                Hemmelig, [he`m:(ə)li], {t('home.norwegian_meaning')}
            </p>
        </div>
    );
};

const ErrorBanner = ({ message, onDismiss }) => {
    const { t } = useTranslation();
    return (
        <div
            className="relative bg-gradient-to-br from-red-950/40 to-red-900/30 
                        backdrop-blur-sm rounded-xl border border-red-500/20 
                        shadow-lg shadow-red-500/5"
        >
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
                            aria-label={t('home.dismiss')}
                        >
                            <IconX className="text-red-400" size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const FieldError = ({ message }) => (
    <div className="flex items-center gap-2 mt-2">
        <div className="p-1 bg-red-500/10 rounded">
            <IconAlertCircle className="text-red-400" size={12} />
        </div>
        <span className="text-xs font-medium text-red-400">{message}</span>
    </div>
);

const FormSection = ({ title, subtitle, children, error, collapsible }) => {
    const [isCollapsed, setIsCollapsed] = useState(collapsible);

    return (
        <div className="relative space-y-4 mb-4">
            {title && (
                <div
                    className={`space-y-1 ${collapsible ? 'cursor-pointer' : ''}`}
                    onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white/90">{title}</h2>
                        {collapsible && (
                            <button
                                type="button"
                                className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
                                aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                            >
                                <svg
                                    className={`w-5 h-5 transform transition-transform duration-200 ${
                                        isCollapsed ? '-rotate-90' : ''
                                    }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                    {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
                </div>
            )}
            <div
                className={`
                    relative overflow-hidden transition-all duration-200 ease-in-out
                    ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}
                `}
            >
                <div
                    className={`
                        relative overflow-hidden
                        md:bg-gradient-to-br md:from-gray-800/50 md:to-gray-900/50
                        md:border ${error ? 'border-red-500/20' : 'border-white/[0.08]'}
                    `}
                >
                    <div className="relative md:p-6">{children}</div>
                </div>
            </div>
            {error && <FieldError message={error} />}
        </div>
    );
};

export default Home;
