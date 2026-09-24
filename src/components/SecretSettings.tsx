import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { useHemmeligStore } from '../store/hemmeligStore';
import { useSecretStore } from '../store/secretStore';
import { useThemeStore } from '../store/themeStore';
import { useUserStore } from '../store/userStore';
import { copyToClipboard as copyText } from '../utils/clipboard';
import { Button } from './Button';
import { EXPIRATION_OPTIONS } from './SecuritySettings';

/** The screen after a secret is created: the link, the password, the QR code and the facts. */
export const SecretSettings = () => {
    const {
        secretId,
        decryptionKey,
        password,
        expiresAt,
        views,
        isBurnable,
        ipRange,
        fileCount,
        resetSecret,
    } = useSecretStore();
    const { t } = useTranslation();
    const { settings: instanceSettings } = useHemmeligStore();
    const { user } = useUserStore();
    const { theme } = useThemeStore();
    const [copied, setCopied] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showQr, setShowQr] = useState(false);
    const [isBurning, setIsBurning] = useState(false);

    const linkBase = `${window.location.origin}/secret/${secretId}`;
    const linkFragment = password ? '' : `#decryptionKey=${decryptionKey}`;
    const secretUrl = linkBase + linkFragment;

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(null), 1600);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const handleCopy = async (text: string, field: string) => {
        if (await copyText(text)) {
            setCopied(field);
        }
    };

    const handleBurnSecret = async () => {
        if (!secretId) return;
        setIsBurning(true);
        try {
            const response = await api.secrets[':id'].$delete({ param: { id: secretId } });
            if (!response.ok) {
                throw new Error(`Delete failed with status ${response.status}`);
            }
            resetSecret();
        } catch (error) {
            console.error('Failed to burn secret:', error);
            toast.error(t('secret_settings.failed_to_burn'));
        } finally {
            setIsBurning(false);
        }
    };

    const expiration = EXPIRATION_OPTIONS.find((option) => option.value === expiresAt);
    const facts = [
        {
            label: t('secret_settings.facts.expires'),
            value: t('secret_settings.facts.expires_in', {
                duration: expiration
                    ? t(`expiration.${expiration.key}`)
                    : t('expiration.default_hours', { hours: Math.round(expiresAt / 3600) }),
            }),
        },
        {
            label: t('secret_settings.facts.views'),
            value: isBurnable ? t('secret_settings.facts.burn_at_expiry') : String(views),
        },
        {
            label: t('secret_settings.facts.password'),
            value: password
                ? t('secret_settings.facts.password_required')
                : t('secret_settings.facts.none'),
        },
        {
            label: t('secret_settings.facts.ip'),
            value: ipRange || t('secret_settings.facts.any_ip'),
        },
        { label: t('secret_settings.facts.files'), value: String(fileCount) },
    ];

    const qrColors =
        theme === 'dark' ? { bg: '#14181d', fg: '#e6e8ea' } : { bg: '#ffffff', fg: '#14171b' };

    return (
        <main className="max-w-content mx-auto px-6 py-12 grid gap-5">
            <div className="flex items-center gap-3">
                <span aria-hidden="true" className="w-2.5 h-2.5 bg-accent" />
                <h1 className="m-0 text-2xl font-medium tracking-tight">
                    {t('secret_settings.secret_created_title')}
                </h1>
            </div>

            <div className="border border-line rounded-md bg-surface overflow-hidden">
                <div
                    data-testid="secret-url"
                    className="p-5.5 font-mono text-body leading-relaxed break-all"
                >
                    <span>{linkBase}</span>
                    <span className="text-accent">{linkFragment}</span>
                </div>

                {password && (
                    <div className="flex flex-wrap gap-3 items-center px-5.5 py-3 border-t border-line-soft">
                        <span className="w-20 text-ui text-muted">
                            {t('secret_settings.password_label')}
                        </span>
                        <span className="flex-1 min-w-0 font-mono text-sm break-all">
                            {showPassword ? password : '•'.repeat(Math.max(5, password.length))}
                        </span>
                        <Button
                            variant="ghost"
                            size="inline"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword
                                ? t('secret_settings.hide_password')
                                : t('secret_settings.show_password')}
                        </Button>
                        <Button
                            variant="link"
                            size="inline"
                            onClick={() => handleCopy(password, 'password')}
                        >
                            {copied === 'password' ? t('common.copied') : t('common.copy')}
                        </Button>
                    </div>
                )}

                {showQr && (
                    <div className="flex flex-wrap gap-5 items-center p-5.5 border-t border-line-soft">
                        <div className="p-2 border border-line rounded-sm bg-surface">
                            <QRCodeCanvas
                                value={secretUrl}
                                size={150}
                                bgColor={qrColors.bg}
                                fgColor={qrColors.fg}
                                title={t('secret_settings.qr_title')}
                            />
                        </div>
                        <p className="m-0 max-w-70 text-ui text-muted">
                            {t('secret_settings.qr_description')}
                        </p>
                    </div>
                )}

                <div className="flex flex-wrap gap-2.5 p-3 border-t border-line-soft">
                    <Button
                        variant="primary"
                        className="px-4 py-2.25"
                        onClick={() => handleCopy(secretUrl, 'url')}
                    >
                        {copied === 'url'
                            ? t('common.copied')
                            : t('secret_settings.copy_url_button')}
                    </Button>
                    <Button
                        variant="secondary"
                        className="py-2.25"
                        onClick={() => setShowQr(!showQr)}
                        aria-expanded={showQr}
                    >
                        {showQr ? t('secret_settings.hide_qr') : t('secret_settings.show_qr')}
                    </Button>
                    <Button
                        variant="danger"
                        className="ml-auto py-2.25"
                        onClick={handleBurnSecret}
                        loading={isBurning}
                    >
                        {t('secret_settings.burn_secret_button')}
                    </Button>
                </div>
            </div>

            <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-px bg-line-soft border border-line-soft rounded-md overflow-hidden">
                {facts.map((fact) => (
                    <div key={fact.label} className="px-4 py-3.5 bg-canvas">
                        <dt className="text-xs text-muted">{fact.label}</dt>
                        <dd className="m-0 font-mono text-sm break-all">{fact.value}</dd>
                    </div>
                ))}
            </dl>

            {password && (
                <p className="m-0 text-sm text-warn">{t('secret_settings.password_warning')}</p>
            )}

            <div className="flex flex-wrap gap-5 text-sm">
                <button
                    type="button"
                    onClick={resetSecret}
                    className="text-accent hover:underline cursor-pointer"
                >
                    {t('secret_settings.create_new_secret_button')}
                </button>
                {user && (
                    <Link to="/dashboard" className="text-muted hover:text-fg">
                        {t('secret_settings.your_secrets')}
                    </Link>
                )}
            </div>

            {instanceSettings?.maxSecretsPerUser && (
                <p className="m-0 text-xs text-faint">
                    {t('secret_settings.max_secrets_per_user_info', {
                        count: instanceSettings.maxSecretsPerUser,
                    })}
                </p>
            )}
        </main>
    );
};
