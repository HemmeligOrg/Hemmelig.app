import {
    IconDownload,
    IconEye,
    IconHeading,
    IconLock,
    IconPerspective,
    IconShieldLock,
    IconSquarePlus,
} from '@tabler/icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';

import { decrypt } from '../../../shared/helpers/crypto';
import { getSecret, secretExists } from '../../api/secret';
import { downloadFile } from '../../api/upload';
import ErrorBox from '../../components/error-box';
import Quill from '../../components/quill';

const getEncryptionKeyHash = (hash) => {
    const id = '#encryption_key=';
    if (!hash || !hash.includes(id)) return '';
    const [_, encryptionKey] = hash.split('#encryption_key=');
    return encryptionKey;
};

const Secret = () => {
    const { t } = useTranslation();
    const { hash = '' } = useLocation();
    const { secretId, encryptionKey = getEncryptionKeyHash(hash) } = useParams();

    // State management
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

    // Fetch secret existence on mount
    useEffect(() => {
        (async () => {
            const response = await secretExists(secretId);
            if (response.statusCode === 401) {
                setIsPasswordRequired(true);
                return;
            }
            if (response.error) {
                setError(response.error);
            } else {
                setMaxViews(response.maxViews);
            }
        })();
    }, [secretId]);

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
                const text = json.isPublic
                    ? json.secret
                    : decrypt(json.secret, decryptionKey + password);

                setSecret(text);

                if (json.title) {
                    setTitle(
                        json.isPublic ? json.title : decrypt(json.title, decryptionKey + password)
                    );
                }

                setMaxViews(json.maxViews);

                if (json.files) {
                    setFiles(json.files);
                }

                if (json.preventBurn) {
                    setPreventBurn(json.preventBurn);
                }

                setIsSecretOpen(true);
                setError(null);
            } catch (error) {
                setError(error.message);
            }
        }
    };

    const onPasswordChange = (event) => {
        setPassword(event.target.value);
    };

    const onFileDownload = (file) => {
        downloadFile({
            file,
            secretId,
            decryptionKey: decryptionKey + password,
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
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold text-white">
                        {t('secret.view_your_secret')}
                    </h1>
                    <p className="text-base text-gray-400">{t('secret.will_show_once')}</p>
                    {maxViews > 0 && !preventBurn && (
                        <div className="flex justify-end -mt-2">
                            <div className="inline-flex items-center gap-2 text-sm bg-gray-800/50 px-3 py-1.5 rounded-full">
                                <span className="text-gray-400">{t('secret.views_left')}</span>
                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-gray-700">
                                    <strong className="text-white">{maxViews}</strong>
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {error && <ErrorBox message={error} />}

                {/* Main Content */}
                <div
                    className={`space-y-6 p-6 rounded-lg transition-all duration-200 ${
                        !isSecretOpen
                            ? 'bg-gray-800/30 border-2 border-gray-700/50 shadow-lg relative'
                            : 'bg-gray-800/50'
                    }`}
                >
                    {!isSecretOpen && (
                        <div className="flex flex-col items-center justify-center gap-8 py-8">
                            <IconLock className="text-gray-600 animate-pulse" size={48} />

                            <div className="w-full max-w-md space-y-6">
                                {/* Password Input */}
                                {isPasswordRequired && (
                                    <div className="space-y-2">
                                        <p className="text-base text-center text-gray-300">
                                            {t('secret.password_required')}
                                        </p>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                                <IconLock size={14} />
                                            </span>
                                            <input
                                                type="password"
                                                id="lemon-password"
                                                placeholder="********"
                                                value={password}
                                                onChange={onPasswordChange}
                                                maxLength={28}
                                                required
                                                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md 
                                                         focus:ring-2 focus:ring-gray-600 focus:border-transparent
                                                         text-gray-100 placeholder-gray-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Decryption Key Input */}
                                {!encryptionKey && (
                                    <div className="space-y-2">
                                        <p className="text-base text-center text-gray-300">
                                            {t('home.decryption_key')}
                                        </p>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                                <IconShieldLock size={14} />
                                            </span>
                                            <input
                                                type="text"
                                                placeholder={t('home.decryption_key')}
                                                value={decryptionKey}
                                                onChange={(event) =>
                                                    setDecryptionKey(event.target.value)
                                                }
                                                required
                                                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md 
                                                         focus:ring-2 focus:ring-gray-600 focus:border-transparent
                                                         text-gray-100 placeholder-gray-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Secret Content when open */}
                    {isSecretOpen && (
                        <div>
                            {/* Title if exists */}
                            {title && (
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                        <IconHeading size={14} />
                                    </span>
                                    <input
                                        type="text"
                                        value={title}
                                        readOnly
                                        className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md 
                                                 text-gray-100"
                                    />
                                </div>
                            )}

                            {/* Secret Content */}
                            <div className="w-full">
                                <Quill value={secret} secretId={secretId} readOnly />
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4">
                    {/* View Secret Button */}
                    {!isSecretOpen && (
                        <button
                            onClick={fetchSecret}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white 
                                     rounded-md hover:bg-gray-500 transition-colors"
                        >
                            <IconEye size={14} />
                            {t('secret.view_secret')}
                        </button>
                    )}

                    {/* File Download Buttons */}
                    {files?.length > 0 &&
                        files.map((file) => (
                            <button
                                key={file.key}
                                onClick={() => onFileDownload(file)}
                                disabled={isDownloaded.some((key) => key === file.key)}
                                className="flex items-center gap-2 px-4 py-2 bg-hemmelig text-white 
                                     hover:bg-hemmelig-700 rounded-md transition-colors
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <IconDownload size={14} />
                                {'hemmelig_files.' + file.ext}
                            </button>
                        ))}

                    {/* Convert Base64 Button */}
                    {isSecretOpen && (
                        <button
                            onClick={convertBase64ToPlain}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 
                                     hover:bg-gray-700 hover:text-white rounded-md transition-colors"
                        >
                            <IconPerspective size={14} />
                            {!hasConvertedBase64ToPlain
                                ? t('secret.convert_b64')
                                : t('secret.convert_utf8')}
                        </button>
                    )}

                    {/* Create New Secret Button */}
                    {isSecretOpen && (
                        <Link
                            to="/"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 
                                     hover:bg-gray-700 hover:text-white rounded-md transition-colors"
                        >
                            <IconSquarePlus size={14} />
                            {t('secret.create_secret')}
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Secret;
