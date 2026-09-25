import { type ChangeEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Input, Select, Textarea } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Notice } from '../../components/Notice';
import { PageHeader } from '../../components/PageHeader';
import {
    SettingRow,
    SettingsFooter,
    SettingsHeading,
    SettingsPanel,
} from '../../components/Settings';
import { Tabs } from '../../components/Tabs';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { useHemmeligStore } from '../../store/hemmeligStore';
import { type DefaultTheme } from '../../store/themeStore';

type InstanceSettings = {
    instanceName: string;
    instanceDescription: string;
    instanceLogo: string;
    instanceLogoDark: string;
    defaultTheme: DefaultTheme;
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    maxSecretsPerUser: number;
    defaultSecretExpiration: number;
    defaultMaxViews: number;
    maxSecretSize: number;
    importantMessage: string;
    enforceHttps: boolean;
    allowPasswordProtection: boolean;
    allowIpRestriction: boolean;
    allowFileUploads: boolean;
    maxPasswordAttempts: number;
    sessionTimeout: number;
    enableRateLimiting: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
    requireInviteCode: boolean;
    allowedEmailDomains: string;
    requireRegisteredUser: boolean;
    disableEmailPasswordSignup: boolean;
    webhookEnabled: boolean;
    webhookUrl: string;
    webhookSecret: string;
    webhookOnView: boolean;
    webhookOnBurn: boolean;
    metricsEnabled: boolean;
    metricsSecret: string;
    lockedByEnvironment?: Record<string, string>;
    error?: string;
    managed?: boolean;
};

type LogoKey = 'instanceLogo' | 'instanceLogoDark';

const THEME_OPTIONS: DefaultTheme[] = ['dark', 'light', 'system'];
const MAX_DEFAULT_VIEWS = 9999;

type Tab = 'general' | 'security' | 'organization' | 'webhook' | 'metrics';

const TAB_IDS: Tab[] = ['general', 'security', 'organization', 'webhook', 'metrics'];

const isTab = (value: string | null): value is Tab => TAB_IDS.includes(value as Tab);

// The API stores the default expiration as whole hours, so the list starts at 1 hour.
const EXPIRATION_OPTIONS = [
    { hours: 672, labelKey: 'expiration.28_days' },
    { hours: 336, labelKey: 'expiration.14_days' },
    { hours: 168, labelKey: 'expiration.7_days' },
    { hours: 72, labelKey: 'expiration.3_days' },
    { hours: 24, labelKey: 'expiration.1_day' },
    { hours: 12, labelKey: 'expiration.12_hours' },
    { hours: 4, labelKey: 'expiration.4_hours' },
    { hours: 1, labelKey: 'expiration.1_hour' },
];

const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp'];
const MAX_LOGO_BYTES = 512 * 1024;

/** Keeps the digits of an input value. An empty value becomes 0. */
const toNumber = (raw: string) => Number(raw.replace(/\D/g, ''));

interface NumberControlProps {
    value: number;
    onChange: (value: number) => void;
    disabled: boolean;
    suffix?: string;
    label: string;
}

function NumberControl({ value, onChange, disabled, suffix, label }: NumberControlProps) {
    return (
        <>
            <div className="w-[110px]">
                <Input
                    mono
                    inputMode="numeric"
                    value={value ? String(value) : ''}
                    onChange={(e) => onChange(toNumber(e.target.value))}
                    disabled={disabled}
                    aria-label={label}
                    className="text-right"
                />
            </div>
            <span className="font-mono text-xs text-muted min-w-7">{suffix}</span>
        </>
    );
}

export function InstancePage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    // Read the tab from the URL once. Local state keeps unsaved edits when the tab changes.
    const [activeTab, setActiveTab] = useState<Tab>(() => {
        const tab = searchParams.get('tab');
        return isTab(tab) ? tab : 'general';
    });
    const loaderData = useLoaderData() as InstanceSettings;
    const isManaged = loaderData?.managed ?? false;

    const {
        generalSettings,
        securitySettings,
        organizationSettings,
        webhookSettings,
        metricsSettings,
        isLoading,
        error,
        initializeAdminSettings,
        setGeneralSetting,
        setSecuritySetting,
        setOrganizationSetting,
        setWebhookSetting,
        setMetricsSetting,
        saveSettings,
        lockedByEnvironment,
    } = useHemmeligStore();

    // Settings that an environment variable controls are read-only, like in managed mode.
    const isLocked = (key: string) => isManaged || key in lockedByEnvironment;

    // Initialize store with loader data
    useEffect(() => {
        if (loaderData && !loaderData.error) {
            initializeAdminSettings(loaderData);
        }
    }, [loaderData, initializeAdminSettings]);

    const logoInputRefs = {
        instanceLogo: useRef<HTMLInputElement>(null),
        instanceLogoDark: useRef<HTMLInputElement>(null),
    };
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const sectionSettings: Record<Tab, object> = {
        general: generalSettings,
        security: securitySettings,
        organization: organizationSettings,
        webhook: webhookSettings,
        metrics: metricsSettings,
    };

    // The result of the last save and the settings object it saved. Each edit
    // makes a new settings object, so the result hides again after an edit.
    const [lastSave, setLastSave] = useState<{ snapshot: object; ok: boolean } | null>(null);
    const saveResult = lastSave?.snapshot === sectionSettings[activeTab] ? lastSave : null;

    const handleSaveSettings = async (section: Tab) => {
        if (isManaged) return;
        const snapshot = sectionSettings[section];
        const ok = await saveSettings(section);
        setLastSave({ snapshot, ok });
    };

    const handleLogoUpload = (key: LogoKey, event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!LOGO_TYPES.includes(file.type)) {
            setErrorMessage(t('instance_page.general_settings.logo_invalid_type'));
            setIsErrorModalOpen(true);
            return;
        }

        if (file.size > MAX_LOGO_BYTES) {
            setErrorMessage(t('instance_page.general_settings.logo_too_large'));
            setIsErrorModalOpen(true);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setGeneralSetting(key, base64String);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = (key: LogoKey) => {
        setGeneralSetting(key, '');
        const input = logoInputRefs[key].current;
        if (input) {
            input.value = '';
        }
    };

    const header = (
        <PageHeader title={t('instance_page.title')} description={t('instance_page.description')} />
    );

    if (error || loaderData?.error) {
        return (
            <div className="grid gap-5 content-start">
                {header}
                <Notice tone="danger">{error || loaderData?.error}</Notice>
            </div>
        );
    }

    const label = (name: string) => t(`instance_page.fields.${name}.label`);
    const describe = (name: string) => t(`instance_page.fields.${name}.description`);

    // Outside managed mode, a locked row names the environment variable that sets it.
    const lockNote = (key?: string) =>
        key && !isManaged && lockedByEnvironment[key]
            ? t('instance_page.env_locked', { variable: lockedByEnvironment[key] })
            : undefined;

    const toggleRow = (
        name: string,
        checked: boolean,
        onChange: (checked: boolean) => void,
        dim = false,
        settingKey?: string
    ) => {
        return (
            <SettingRow
                label={label(name)}
                description={lockNote(settingKey) ?? describe(name)}
                dim={dim}
            >
                <ToggleSwitch
                    checked={checked}
                    onChange={onChange}
                    disabled={settingKey ? isLocked(settingKey) : isManaged}
                    label={label(name)}
                />
            </SettingRow>
        );
    };

    const controlRow = (
        name: string,
        control: ReactNode,
        dim = false,
        description?: string,
        settingKey?: string
    ) => (
        <SettingRow
            label={label(name)}
            description={lockNote(settingKey) ?? description ?? describe(name)}
            dim={dim}
        >
            {control}
        </SettingRow>
    );

    const logoControl = (key: LogoKey) => {
        const value = generalSettings[key];
        const locked = isLocked(key);
        return (
            <>
                {value ? (
                    <img
                        src={value}
                        alt={t('instance_page.general_settings.logo_alt')}
                        className="w-10 h-10 object-contain rounded-sm border border-line bg-surface"
                    />
                ) : (
                    <span
                        aria-hidden="true"
                        className="w-10 h-10 rounded-sm border border-dashed border-line"
                    />
                )}
                <input
                    ref={logoInputRefs[key]}
                    type="file"
                    accept={LOGO_TYPES.join(',')}
                    onChange={(event) => handleLogoUpload(key, event)}
                    disabled={locked}
                    className="hidden"
                    data-testid={`${key}-input`}
                />
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => logoInputRefs[key].current?.click()}
                    disabled={locked}
                >
                    {t('instance_page.general_settings.logo_upload')}
                </Button>
                {value && !locked && (
                    <Button variant="danger" size="inline" onClick={() => handleRemoveLogo(key)}>
                        {t('instance_page.general_settings.logo_remove')}
                    </Button>
                )}
            </>
        );
    };

    const expirationOptions = EXPIRATION_OPTIONS.some(
        (option) => option.hours === generalSettings.defaultSecretExpiration
    )
        ? EXPIRATION_OPTIONS.map((option) => ({ hours: option.hours, label: t(option.labelKey) }))
        : [
              {
                  hours: generalSettings.defaultSecretExpiration,
                  label: t('instance_page.fields.default_expiration.hours', {
                      count: generalSettings.defaultSecretExpiration,
                  }),
              },
              ...EXPIRATION_OPTIONS.map((option) => ({
                  hours: option.hours,
                  label: t(option.labelKey),
              })),
          ];

    const tabs = TAB_IDS.map((id) => ({ id, label: t(`instance_page.tabs.${id}`) }));

    const rateLimitOff = !securitySettings.enableRateLimiting;
    const webhooksOff = !webhookSettings.webhookEnabled;
    const metricsOff = !metricsSettings.metricsEnabled;

    return (
        <div className="grid gap-5 content-start">
            {header}

            {isManaged && <Notice tone="warn">{t('instance_page.managed_notice')}</Notice>}

            <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

            <SettingsPanel>
                {activeTab === 'general' && (
                    <>
                        {controlRow(
                            'instance_name',
                            <Input
                                mono
                                value={generalSettings.instanceName}
                                onChange={(e) => setGeneralSetting('instanceName', e.target.value)}
                                disabled={isLocked('instanceName')}
                                aria-label={label('instance_name')}
                            />,
                            false,
                            undefined,
                            'instanceName'
                        )}
                        {controlRow(
                            'logo',
                            logoControl('instanceLogo'),
                            false,
                            t('instance_page.general_settings.logo_hint'),
                            'instanceLogo'
                        )}
                        {controlRow(
                            'logo_dark',
                            logoControl('instanceLogoDark'),
                            false,
                            t('instance_page.fields.logo_dark.description')
                        )}
                        {controlRow(
                            'default_theme',
                            <Select
                                mono
                                className="min-w-40"
                                value={generalSettings.defaultTheme}
                                onChange={(e) =>
                                    setGeneralSetting(
                                        'defaultTheme',
                                        e.target.value as DefaultTheme
                                    )
                                }
                                disabled={isManaged}
                                aria-label={label('default_theme')}
                            >
                                {THEME_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {t(`instance_page.fields.default_theme.${option}`)}
                                    </option>
                                ))}
                            </Select>
                        )}
                        {controlRow(
                            'instance_description',
                            <Textarea
                                rows={2}
                                value={generalSettings.instanceDescription}
                                onChange={(e) =>
                                    setGeneralSetting('instanceDescription', e.target.value)
                                }
                                disabled={isLocked('instanceDescription')}
                                aria-label={label('instance_description')}
                            />,
                            false,
                            undefined,
                            'instanceDescription'
                        )}
                        {controlRow(
                            'important_message',
                            <Textarea
                                rows={2}
                                value={generalSettings.importantMessage}
                                onChange={(e) =>
                                    setGeneralSetting('importantMessage', e.target.value)
                                }
                                placeholder={t(
                                    'instance_page.fields.important_message.placeholder'
                                )}
                                disabled={isManaged}
                                aria-label={label('important_message')}
                            />
                        )}
                        {controlRow(
                            'default_expiration',
                            <Select
                                mono
                                className="min-w-40"
                                value={generalSettings.defaultSecretExpiration}
                                onChange={(e) =>
                                    setGeneralSetting(
                                        'defaultSecretExpiration',
                                        Number(e.target.value)
                                    )
                                }
                                disabled={isManaged}
                                aria-label={label('default_expiration')}
                            >
                                {expirationOptions.map((option) => (
                                    <option key={option.hours} value={option.hours}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        )}
                        {controlRow(
                            'default_max_views',
                            <NumberControl
                                value={generalSettings.defaultMaxViews}
                                onChange={(value) =>
                                    setGeneralSetting(
                                        'defaultMaxViews',
                                        Math.min(MAX_DEFAULT_VIEWS, value)
                                    )
                                }
                                disabled={isManaged}
                                label={label('default_max_views')}
                            />
                        )}
                        {controlRow(
                            'max_secret_size',
                            <NumberControl
                                value={generalSettings.maxSecretSize}
                                onChange={(value) => setGeneralSetting('maxSecretSize', value)}
                                disabled={isManaged}
                                suffix={t('instance_page.units.kb')}
                                label={label('max_secret_size')}
                            />
                        )}
                    </>
                )}

                {activeTab === 'security' && (
                    <>
                        <SettingsHeading>
                            {t('instance_page.headings.secret_options')}
                        </SettingsHeading>
                        {toggleRow(
                            'password_protection',
                            securitySettings.allowPasswordProtection,
                            (checked) => setSecuritySetting('allowPasswordProtection', checked),
                            false,
                            'allowPasswordProtection'
                        )}
                        {toggleRow(
                            'ip_restriction',
                            securitySettings.allowIpRestriction,
                            (checked) => setSecuritySetting('allowIpRestriction', checked),
                            false,
                            'allowIpRestriction'
                        )}
                        {toggleRow('file_uploads', securitySettings.allowFileUploads, (checked) =>
                            setSecuritySetting('allowFileUploads', checked)
                        )}
                        <SettingsHeading>
                            {t('instance_page.headings.rate_limiting')}
                        </SettingsHeading>
                        {toggleRow(
                            'rate_limiting',
                            securitySettings.enableRateLimiting,
                            (checked) => setSecuritySetting('enableRateLimiting', checked)
                        )}
                        {controlRow(
                            'rate_limit_requests',
                            <NumberControl
                                value={securitySettings.rateLimitRequests}
                                onChange={(value) => setSecuritySetting('rateLimitRequests', value)}
                                disabled={isManaged}
                                label={label('rate_limit_requests')}
                            />,
                            rateLimitOff
                        )}
                        {controlRow(
                            'rate_limit_window',
                            <NumberControl
                                value={securitySettings.rateLimitWindow}
                                onChange={(value) => setSecuritySetting('rateLimitWindow', value)}
                                disabled={isManaged}
                                suffix={t('instance_page.units.seconds')}
                                label={label('rate_limit_window')}
                            />,
                            rateLimitOff
                        )}
                    </>
                )}

                {activeTab === 'organization' && (
                    <>
                        {toggleRow(
                            'require_invite_code',
                            organizationSettings.requireInviteCode,
                            (checked) => setOrganizationSetting('requireInviteCode', checked)
                        )}
                        {controlRow(
                            'allowed_email_domains',
                            <Input
                                mono
                                value={organizationSettings.allowedEmailDomains}
                                onChange={(e) =>
                                    setOrganizationSetting('allowedEmailDomains', e.target.value)
                                }
                                placeholder={t(
                                    'organization_page.registration_settings.allowed_domains_placeholder'
                                )}
                                disabled={isManaged}
                                aria-label={label('allowed_email_domains')}
                            />
                        )}
                        {toggleRow(
                            'require_registered_user',
                            organizationSettings.requireRegisteredUser,
                            (checked) => setOrganizationSetting('requireRegisteredUser', checked)
                        )}
                        {toggleRow(
                            'social_login_only',
                            organizationSettings.disableEmailPasswordSignup,
                            (checked) =>
                                setOrganizationSetting('disableEmailPasswordSignup', checked)
                        )}
                    </>
                )}

                {activeTab === 'webhook' && (
                    <>
                        {toggleRow('webhooks', webhookSettings.webhookEnabled, (checked) =>
                            setWebhookSetting('webhookEnabled', checked)
                        )}
                        {controlRow(
                            'webhook_url',
                            <Input
                                mono
                                type="url"
                                value={webhookSettings.webhookUrl}
                                onChange={(e) => setWebhookSetting('webhookUrl', e.target.value)}
                                placeholder={t('webhook_settings.webhook_url_placeholder')}
                                disabled={isManaged}
                                aria-label={label('webhook_url')}
                            />,
                            webhooksOff
                        )}
                        {controlRow(
                            'webhook_secret',
                            <Input
                                mono
                                type="password"
                                value={webhookSettings.webhookSecret}
                                onChange={(e) => setWebhookSetting('webhookSecret', e.target.value)}
                                placeholder={t('webhook_settings.webhook_secret_placeholder')}
                                disabled={isManaged}
                                autoComplete="off"
                                aria-label={label('webhook_secret')}
                            />,
                            webhooksOff
                        )}
                        {toggleRow(
                            'webhook_on_view',
                            webhookSettings.webhookOnView,
                            (checked) => setWebhookSetting('webhookOnView', checked),
                            webhooksOff
                        )}
                        {toggleRow(
                            'webhook_on_burn',
                            webhookSettings.webhookOnBurn,
                            (checked) => setWebhookSetting('webhookOnBurn', checked),
                            webhooksOff
                        )}
                    </>
                )}

                {activeTab === 'metrics' && (
                    <>
                        {toggleRow('metrics', metricsSettings.metricsEnabled, (checked) =>
                            setMetricsSetting('metricsEnabled', checked)
                        )}
                        {controlRow(
                            'metrics_secret',
                            <Input
                                mono
                                type="password"
                                value={metricsSettings.metricsSecret}
                                onChange={(e) => setMetricsSetting('metricsSecret', e.target.value)}
                                placeholder={t('metrics_settings.metrics_secret_placeholder')}
                                disabled={isManaged}
                                autoComplete="off"
                                aria-label={label('metrics_secret')}
                            />,
                            metricsOff
                        )}
                        {controlRow(
                            'metrics_endpoint',
                            <code className="font-mono text-ui text-fg-3">GET /api/metrics</code>,
                            metricsOff
                        )}
                    </>
                )}

                <SettingsFooter
                    note={
                        isManaged
                            ? t('instance_page.note_managed')
                            : saveResult
                              ? saveResult.ok
                                  ? t('instance_page.note_saved')
                                  : t('instance_page.note_save_failed')
                              : t('instance_page.note_default')
                    }
                    tone={saveResult ? (saveResult.ok ? 'accent' : 'danger') : 'muted'}
                >
                    <Button
                        variant="primary"
                        loading={isLoading}
                        disabled={isManaged}
                        onClick={() => handleSaveSettings(activeTab)}
                    >
                        {isLoading
                            ? t('instance_page.saving_button')
                            : t('instance_page.save_settings_button')}
                    </Button>
                </SettingsFooter>
            </SettingsPanel>

            <Modal
                isOpen={isErrorModalOpen}
                onClose={() => setIsErrorModalOpen(false)}
                title={t('common.error')}
                confirmText={t('common.ok')}
                onConfirm={() => setIsErrorModalOpen(false)}
                confirmVariant="primary"
            >
                <p>{errorMessage}</p>
            </Modal>
        </div>
    );
}
