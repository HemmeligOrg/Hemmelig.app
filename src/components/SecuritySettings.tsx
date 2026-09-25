import { type ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHemmeligStore } from '../store/hemmeligStore';
import { useSecretSettingsStore } from '../store/secretSettingsStore';
import { useSecretStore } from '../store/secretStore';
import { Chip } from './Chip';
import { Input } from './Input';
import { ToggleSwitch } from './ToggleSwitch';

/** Expiration choices in seconds. The API accepts only these values. */
export const EXPIRATION_OPTIONS = [
    { value: 300, key: '5_minutes', short: '5m' },
    { value: 1800, key: '30_minutes', short: '30m' },
    { value: 3600, key: '1_hour', short: '1h' },
    { value: 14400, key: '4_hours', short: '4h' },
    { value: 43200, key: '12_hours', short: '12h' },
    { value: 86400, key: '1_day', short: '1d' },
    { value: 259200, key: '3_days', short: '3d' },
    { value: 604800, key: '7_days', short: '7d' },
    { value: 1209600, key: '14_days', short: '14d' },
    { value: 2419200, key: '28_days', short: '28d' },
] as const;

export const MIN_PASSWORD_LENGTH = 5;
const MAX_VIEWS = 9999;

interface OptionRowProps {
    label: string;
    children: ReactNode;
    control?: ReactNode;
    last?: boolean;
}

/** One row of the options panel: a label, the content and an optional switch. */
function OptionRow({ label, children, control, last = false }: OptionRowProps) {
    return (
        <div
            className={`grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[140px_minmax(0,1fr)_auto] gap-x-4 gap-y-2 px-4.5 py-3.5 items-center ${
                last ? '' : 'border-b border-line-soft'
            }`}
        >
            <span className="col-span-2 sm:col-span-1 text-ui text-muted">{label}</span>
            <div className={`min-w-0 ${control ? '' : 'col-span-2 sm:col-span-2'}`}>{children}</div>
            {control}
        </div>
    );
}

/** The collapsible options panel below the composer. */
export function SecuritySettings() {
    const { expiresAt, views, isBurnable, password, ipRange, setSecretData } = useSecretStore();
    const { saveSettings, setSaveSettings, updateSettings } = useSecretSettingsStore();
    const { settings: instanceSettings } = useHemmeligStore();
    const { t } = useTranslation();

    const isPasswordEnabled = password !== null;
    const isIpEnabled = ipRange !== null && ipRange !== undefined;
    const passwordTooShort =
        isPasswordEnabled && !!password && password.length < MIN_PASSWORD_LENGTH;

    // Sync settings to localStorage when saveSettings is enabled
    useEffect(() => {
        if (saveSettings) {
            updateSettings({ expiresAt, views, isBurnable });
        }
    }, [expiresAt, views, isBurnable, saveSettings, updateSettings]);

    const handleBurnAfterTimeToggle = (checked: boolean) => {
        setSecretData({ isBurnable: checked });

        // When enabling burn after time, set a default expiration if none exists
        if (checked && !expiresAt) {
            const defaultExpiration = 14400; // Default to 4 hours in seconds
            setSecretData({ expiresAt: defaultExpiration });
        }
    };

    const setViews = (value: number) =>
        setSecretData({ views: Math.min(MAX_VIEWS, Math.max(1, value)) });

    const knownExpiration = EXPIRATION_OPTIONS.some((option) => option.value === expiresAt);

    return (
        <div className="border border-line rounded-md">
            <OptionRow label={t('security_settings.expiration_title')}>
                <div className="flex flex-wrap gap-1.5">
                    {!knownExpiration && (
                        <Chip selected onClick={() => setSecretData({ expiresAt })}>
                            {t('expiration_short.hours', {
                                hours: Math.round(expiresAt / 3600),
                            })}
                        </Chip>
                    )}
                    {EXPIRATION_OPTIONS.map((option) => (
                        <Chip
                            key={option.value}
                            selected={expiresAt === option.value}
                            onClick={() => setSecretData({ expiresAt: option.value })}
                        >
                            <span aria-hidden="true">{t(`expiration_short.${option.short}`)}</span>
                            <span className="sr-only">{t(`expiration.${option.key}`)}</span>
                        </Chip>
                    ))}
                </div>
            </OptionRow>

            <OptionRow
                label={t('security_settings.burn_after_time_title')}
                control={
                    <ToggleSwitch
                        checked={isBurnable}
                        onChange={handleBurnAfterTimeToggle}
                        label={t('security_settings.burn_after_time_title')}
                    />
                }
            >
                <span className="text-ui text-muted">
                    {t('security_settings.burn_after_time_description')}
                </span>
            </OptionRow>

            {!isBurnable && (
                <OptionRow label={t('security_settings.max_views_title')}>
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={() => setViews(views - 1)}
                            aria-label={t('views_slider.decrease')}
                            className="w-8 h-8 grid place-items-center border border-line rounded-l-sm text-fg-2 hover:text-fg cursor-pointer"
                        >
                            −
                        </button>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={views}
                            onChange={(e) => {
                                const next = parseInt(e.target.value.replace(/\D/g, ''), 10);
                                setViews(isNaN(next) ? 1 : next);
                            }}
                            aria-label={t('security_settings.max_views_title')}
                            className="w-16 h-8 text-center bg-surface border-y border-line text-fg outline-none font-mono text-ui focus:border-accent"
                        />
                        <button
                            type="button"
                            onClick={() => setViews(views + 1)}
                            aria-label={t('views_slider.increase')}
                            className="w-8 h-8 grid place-items-center border border-line rounded-r-sm text-fg-2 hover:text-fg cursor-pointer"
                        >
                            +
                        </button>
                    </div>
                </OptionRow>
            )}

            {instanceSettings.allowPasswordProtection && (
                <OptionRow
                    label={t('security_settings.password_protection_title')}
                    control={
                        <ToggleSwitch
                            checked={isPasswordEnabled}
                            onChange={(on) => setSecretData({ password: on ? '' : null })}
                            label={t('security_settings.password_protection_title')}
                        />
                    }
                >
                    {isPasswordEnabled ? (
                        <div className="grid gap-1">
                            <Input
                                type="text"
                                mono
                                value={password || ''}
                                onChange={(e) => setSecretData({ password: e.target.value })}
                                placeholder={t('security_settings.password_placeholder')}
                                minLength={MIN_PASSWORD_LENGTH}
                                invalid={passwordTooShort}
                                autoComplete="off"
                                spellCheck={false}
                                aria-label={t('security_settings.password_protection_title')}
                                className="!py-1.5"
                            />
                            <span
                                className={`text-xs ${passwordTooShort ? 'text-danger' : 'text-muted'}`}
                            >
                                {passwordTooShort
                                    ? t('security_settings.password_error')
                                    : t('security_settings.password_hint')}
                            </span>
                        </div>
                    ) : (
                        <span className="text-ui text-muted">
                            {t('security_settings.password_protection_description')}
                        </span>
                    )}
                </OptionRow>
            )}

            {instanceSettings.allowIpRestriction && (
                <OptionRow
                    label={t('security_settings.ip_restriction_title')}
                    control={
                        <ToggleSwitch
                            checked={isIpEnabled}
                            onChange={(on) => setSecretData({ ipRange: on ? '' : null })}
                            label={t('security_settings.ip_restriction_title')}
                        />
                    }
                >
                    {isIpEnabled ? (
                        <Input
                            type="text"
                            mono
                            value={ipRange || ''}
                            onChange={(e) => setSecretData({ ipRange: e.target.value })}
                            placeholder={t('security_settings.ip_address_cidr_placeholder')}
                            spellCheck={false}
                            aria-label={t('security_settings.ip_restriction_title')}
                            className="!py-1.5"
                        />
                    ) : (
                        <span className="text-ui text-muted">
                            {t('security_settings.ip_restriction_description')}
                        </span>
                    )}
                </OptionRow>
            )}

            <OptionRow
                label={t('security_settings.remember_settings')}
                last
                control={
                    <ToggleSwitch
                        checked={saveSettings}
                        onChange={setSaveSettings}
                        label={t('security_settings.remember_settings')}
                    />
                }
            >
                <span className="text-ui text-muted">
                    {t('security_settings.remember_description')}
                </span>
            </OptionRow>
        </div>
    );
}
