import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, buttonClassName } from '../../components/Button';
import { Input, Select, Textarea } from '../../components/Input';
import { PageHeader } from '../../components/PageHeader';
import { SettingRow, SettingsFooter, SettingsPanel } from '../../components/Settings';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { useCopyFeedbackWithId } from '../../hooks/useCopyFeedback';
import { api } from '../../lib/api';

// Valid expiration times for the secret (in seconds)
const SECRET_EXPIRATION_OPTIONS = [
    { value: 2419200, labelKey: 'expiration.28_days' },
    { value: 1209600, labelKey: 'expiration.14_days' },
    { value: 604800, labelKey: 'expiration.7_days' },
    { value: 259200, labelKey: 'expiration.3_days' },
    { value: 86400, labelKey: 'expiration.1_day' },
    { value: 43200, labelKey: 'expiration.12_hours' },
    { value: 14400, labelKey: 'expiration.4_hours' },
    { value: 3600, labelKey: 'expiration.1_hour' },
    { value: 1800, labelKey: 'expiration.30_minutes' },
    { value: 300, labelKey: 'expiration.5_minutes' },
];

// Valid durations for request validity (how long the creator link is active)
const REQUEST_VALIDITY_OPTIONS = [
    { value: 2592000, labelKey: 'create_request_page.validity.30_days' },
    { value: 1209600, labelKey: 'create_request_page.validity.14_days' },
    { value: 604800, labelKey: 'create_request_page.validity.7_days' },
    { value: 259200, labelKey: 'create_request_page.validity.3_days' },
    { value: 86400, labelKey: 'create_request_page.validity.1_day' },
    { value: 43200, labelKey: 'create_request_page.validity.12_hours' },
    { value: 3600, labelKey: 'create_request_page.validity.1_hour' },
];

interface CreatedRequest {
    id: string;
    creatorLink: string;
    webhookSecret?: string | null;
    expiresAt: string;
}

type CopyTarget = 'link' | 'webhook';

export function CreateSecretRequestPage() {
    const { t } = useTranslation();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [maxViews, setMaxViews] = useState(1);
    const [expiresIn, setExpiresIn] = useState(86400); // 1 day default for secret
    const [validFor, setValidFor] = useState(604800); // 7 days default for link
    const [allowedIp, setAllowedIp] = useState('');
    const [preventBurn, setPreventBurn] = useState(false);
    const [webhookUrl, setWebhookUrl] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [createdRequest, setCreatedRequest] = useState<CreatedRequest | null>(null);
    const { copy, isCopied } = useCopyFeedbackWithId<CopyTarget>();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await api['secret-requests'].$post({
                json: {
                    title,
                    description: description || undefined,
                    maxViews,
                    expiresIn,
                    validFor,
                    allowedIp: allowedIp || undefined,
                    preventBurn,
                    webhookUrl: webhookUrl || undefined,
                },
            });

            if (res.ok) {
                const data = await res.json();
                setCreatedRequest(data);
                toast.success(t('create_request_page.toast.created'));
            } else {
                const error = await res.json();
                toast.error(error.error || t('create_request_page.toast.create_error'));
            }
        } catch (error) {
            console.error('Failed to create request:', error);
            toast.error(t('create_request_page.toast.create_error'));
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setCreatedRequest(null);
        setTitle('');
        setDescription('');
        setAllowedIp('');
        setWebhookUrl('');
    };

    const copyLabel = (target: CopyTarget) =>
        isCopied(target)
            ? t('create_request_page.success.copied')
            : t('create_request_page.success.copy');

    return (
        <div className="grid gap-5 content-start">
            <PageHeader
                title={t('create_request_page.title')}
                description={t('create_request_page.description')}
                action={
                    !createdRequest && (
                        <Link
                            to="/dashboard/secret-requests"
                            className={buttonClassName({ variant: 'ghost', size: 'inline' })}
                        >
                            {t('create_request_page.back_button')}
                        </Link>
                    )
                }
            />

            {createdRequest ? (
                <div className="border border-accent/50 rounded-md bg-surface max-w-content overflow-hidden">
                    <div className="px-4.5 py-4 grid gap-1.5">
                        <span className="text-ui text-muted">
                            {t('create_request_page.success.link_label')}
                        </span>
                        <span className="font-mono text-sm break-all">
                            {createdRequest.creatorLink}
                        </span>
                        <span className="text-xs text-muted">
                            {t('create_request_page.success.expires_at', {
                                date: new Date(createdRequest.expiresAt).toLocaleString(),
                            })}
                        </span>
                    </div>

                    {createdRequest.webhookSecret && (
                        <div className="px-4.5 py-4 grid gap-1.5 border-t border-line-soft">
                            <span className="text-ui text-muted">
                                {t('create_request_page.success.webhook_secret_label')}
                            </span>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="flex-1 min-w-0 font-mono text-sm break-all">
                                    {createdRequest.webhookSecret}
                                </span>
                                <Button
                                    variant="link"
                                    size="inline"
                                    onClick={() =>
                                        copy(createdRequest.webhookSecret ?? '', 'webhook')
                                    }
                                >
                                    {copyLabel('webhook')}
                                </Button>
                            </div>
                            <span className="text-xs text-warn">
                                {t('create_request_page.success.webhook_secret_warning')}
                            </span>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2.5 p-3 border-t border-line-soft">
                        <Button
                            variant="primary"
                            onClick={() => copy(createdRequest.creatorLink, 'link')}
                        >
                            {copyLabel('link')}
                        </Button>
                        <a
                            href={createdRequest.creatorLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonClassName({ variant: 'secondary' })}
                        >
                            {t('create_request_page.success.open_as_creator')}
                        </a>
                        <Link
                            to="/dashboard/secret-requests"
                            className={buttonClassName({ variant: 'ghost' })}
                        >
                            {t('create_request_page.success.back_to_requests')}
                        </Link>
                        <Button variant="ghost" className="sm:ml-auto" onClick={resetForm}>
                            {t('create_request_page.success.create_another_button')}
                        </Button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <SettingsPanel>
                        <SettingRow
                            label={t('create_request_page.fields.title_label')}
                            description={t('create_request_page.fields.title_hint')}
                        >
                            <Input
                                mono
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={t('create_request_page.fields.title_placeholder')}
                                aria-label={t('create_request_page.fields.title_label')}
                                required
                                maxLength={200}
                            />
                        </SettingRow>

                        <SettingRow
                            label={t('create_request_page.fields.description_label')}
                            description={t('create_request_page.fields.description_hint')}
                        >
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                aria-label={t('create_request_page.fields.description_label')}
                                rows={2}
                                maxLength={1000}
                            />
                        </SettingRow>

                        <SettingRow
                            label={t('create_request_page.fields.valid_for_label')}
                            description={t('create_request_page.fields.valid_for_hint')}
                        >
                            <Select
                                mono
                                className="min-w-40"
                                value={validFor}
                                onChange={(e) => setValidFor(Number(e.target.value))}
                                aria-label={t('create_request_page.fields.valid_for_label')}
                            >
                                {REQUEST_VALIDITY_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {t(option.labelKey)}
                                    </option>
                                ))}
                            </Select>
                        </SettingRow>

                        <SettingRow
                            label={t('create_request_page.fields.expires_in_label')}
                            description={t('create_request_page.fields.expires_in_hint')}
                        >
                            <Select
                                mono
                                className="min-w-40"
                                value={expiresIn}
                                onChange={(e) => setExpiresIn(Number(e.target.value))}
                                aria-label={t('create_request_page.fields.expires_in_label')}
                            >
                                {SECRET_EXPIRATION_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {t(option.labelKey)}
                                    </option>
                                ))}
                            </Select>
                        </SettingRow>

                        <SettingRow
                            label={t('create_request_page.fields.max_views_label')}
                            description={t('create_request_page.fields.max_views_hint')}
                        >
                            <div className="w-28">
                                <Input
                                    mono
                                    type="number"
                                    min={1}
                                    max={9999}
                                    className="text-right"
                                    value={maxViews}
                                    onChange={(e) => setMaxViews(parseInt(e.target.value) || 1)}
                                    aria-label={t('create_request_page.fields.max_views_label')}
                                />
                            </div>
                        </SettingRow>

                        <SettingRow
                            label={t('create_request_page.fields.ip_label')}
                            description={t('create_request_page.fields.ip_hint')}
                        >
                            <Input
                                mono
                                value={allowedIp}
                                onChange={(e) => setAllowedIp(e.target.value)}
                                placeholder={t('create_request_page.fields.ip_placeholder')}
                                aria-label={t('create_request_page.fields.ip_label')}
                            />
                        </SettingRow>

                        <SettingRow
                            label={t('create_request_page.fields.prevent_burn_label')}
                            description={t('create_request_page.fields.prevent_burn_hint')}
                        >
                            <ToggleSwitch
                                checked={preventBurn}
                                onChange={setPreventBurn}
                                label={t('create_request_page.fields.prevent_burn_label')}
                            />
                        </SettingRow>

                        <SettingRow
                            label={t('create_request_page.fields.webhook_label')}
                            description={t('create_request_page.fields.webhook_hint')}
                        >
                            <Input
                                mono
                                type="url"
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                placeholder={t('create_request_page.fields.webhook_placeholder')}
                                aria-label={t('create_request_page.fields.webhook_label')}
                            />
                        </SettingRow>

                        <SettingsFooter>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={isLoading}
                                disabled={!title.trim()}
                            >
                                {isLoading
                                    ? t('create_request_page.form.creating_button')
                                    : t('create_request_page.form.create_button')}
                            </Button>
                        </SettingsFooter>
                    </SettingsPanel>
                </form>
            )}
        </div>
    );
}
