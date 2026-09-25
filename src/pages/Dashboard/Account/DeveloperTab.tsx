import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button';
import { Input, Select } from '../../../components/Input';
import { Table, TableEmpty, TableRow } from '../../../components/Table';
import { useCopyFeedbackWithId } from '../../../hooks/useCopyFeedback';
import { api } from '../../../lib/api';

interface ApiKey {
    id: string;
    name: string;
    keyPrefix: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
}

const keyCols = 'grid-cols-[minmax(0,1.5fr)_140px_120px_70px]';

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 365 * 24 * 60 * 60],
    ['month', 30 * 24 * 60 * 60],
    ['day', 24 * 60 * 60],
    ['hour', 60 * 60],
    ['minute', 60],
];

/** Formats a date relative to now, for example "3 days ago" or "in 2 months". */
const relativeTime = (date: string, locale: string) => {
    const seconds = (new Date(date).getTime() - Date.now()) / 1000;
    const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    for (const [unit, size] of UNITS) {
        if (Math.abs(seconds) >= size) {
            return format.format(Math.round(seconds / size), unit);
        }
    }
    return format.format(0, 'minute');
};

export function DeveloperTab() {
    const { t, i18n } = useTranslation();
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyExpiry, setNewKeyExpiry] = useState<number | undefined>(undefined);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
    const [apiKeyError, setApiKeyError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { copiedId, copy: handleCopyToClipboard } = useCopyFeedbackWithId();
    const locale = i18n.resolvedLanguage ?? i18n.language;

    const fetchApiKeys = async () => {
        try {
            const res = await api['api-keys'].$get();
            if (res.ok) {
                const data = await res.json();
                setApiKeys(data);
            }
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
        }
    };

    useEffect(() => {
        fetchApiKeys();
    }, []);

    const handleCreateApiKey = async () => {
        setApiKeyError('');
        if (!newKeyName.trim()) {
            setApiKeyError(t('account_page.developer.name_required'));
            return;
        }

        setIsLoading(true);
        try {
            const res = await api['api-keys'].$post({
                json: {
                    name: newKeyName.trim(),
                    expiresInDays: newKeyExpiry,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setNewlyCreatedKey(data.key);
                setNewKeyName('');
                setNewKeyExpiry(undefined);
                fetchApiKeys();
            } else {
                const errorData = await res.json();
                setApiKeyError(errorData.error || t('account_page.developer.create_error'));
            }
        } catch (error) {
            console.error('Failed to create API key:', error);
            setApiKeyError(t('account_page.developer.create_error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteApiKey = async (id: string) => {
        try {
            const res = await api['api-keys'][':id'].$delete({ param: { id } });
            if (res.ok) {
                setNewlyCreatedKey(null);
                fetchApiKeys();
            }
        } catch (error) {
            console.error('Failed to delete API key:', error);
        }
    };

    const expiresLabel = (expiresAt: string | null) => {
        if (!expiresAt) return t('account_page.developer.never_expires');
        if (new Date(expiresAt) < new Date()) return t('account_page.developer.expired');
        return relativeTime(expiresAt, locale);
    };

    return (
        <>
            <div className="grid gap-1.5 max-w-content">
                <div className="flex flex-wrap gap-2">
                    <Input
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateApiKey()}
                        placeholder={t('account_page.developer.key_name_placeholder')}
                        aria-label={t('account_page.developer.key_name')}
                        maxLength={100}
                        controlSize="lg"
                        className="flex-1 min-w-[200px]"
                    />
                    <Select
                        value={newKeyExpiry ?? ''}
                        onChange={(e) =>
                            setNewKeyExpiry(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                        aria-label={t('account_page.developer.expiration')}
                        mono
                        className="min-w-[150px]"
                    >
                        <option value="">{t('account_page.developer.never_expires')}</option>
                        <option value="30">{t('account_page.developer.expires_30_days')}</option>
                        <option value="90">{t('account_page.developer.expires_90_days')}</option>
                        <option value="365">{t('account_page.developer.expires_1_year')}</option>
                    </Select>
                    <Button variant="primary" onClick={handleCreateApiKey} loading={isLoading}>
                        {t('account_page.developer.create_key')}
                    </Button>
                </div>
                {apiKeyError && <span className="text-ui text-danger">{apiKeyError}</span>}
            </div>

            {newlyCreatedKey && (
                <div className="border border-accent/50 rounded-md bg-surface px-4.5 py-3.5 grid gap-1 max-w-content">
                    <span className="text-ui text-muted">
                        {t('account_page.developer.key_warning')}
                    </span>
                    <span className="font-mono text-sm text-accent break-all">
                        {newlyCreatedKey}
                    </span>
                    <div className="flex flex-wrap gap-4 pt-1">
                        <Button
                            variant="link"
                            size="inline"
                            onClick={() => handleCopyToClipboard(newlyCreatedKey, 'new')}
                        >
                            {copiedId === 'new'
                                ? t('account_page.developer.copied')
                                : t('account_page.developer.copy')}
                        </Button>
                        <Button
                            variant="ghost"
                            size="inline"
                            onClick={() => setNewlyCreatedKey(null)}
                        >
                            {t('account_page.developer.dismiss')}
                        </Button>
                    </div>
                </div>
            )}

            <Table minWidthClassName="min-w-[560px]" className="max-w-content">
                {apiKeys.length === 0 ? (
                    <TableEmpty>{t('account_page.developer.no_keys')}</TableEmpty>
                ) : (
                    apiKeys.map((apiKey) => (
                        <TableRow key={apiKey.id} className={keyCols}>
                            <div className="min-w-0">
                                <div
                                    className="truncate"
                                    title={`${t('account_page.developer.created')} ${new Date(
                                        apiKey.createdAt
                                    ).toLocaleDateString(locale)}`}
                                >
                                    {apiKey.name}
                                </div>
                                <div className="font-mono text-xs text-faint truncate">
                                    {apiKey.keyPrefix}…
                                </div>
                            </div>
                            <span className="text-ui text-muted">
                                {apiKey.lastUsedAt
                                    ? t('account_page.developer.used', {
                                          time: relativeTime(apiKey.lastUsedAt, locale),
                                      })
                                    : t('account_page.developer.never_used')}
                            </span>
                            <span
                                className={`text-ui ${
                                    apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()
                                        ? 'text-danger'
                                        : 'text-muted'
                                }`}
                            >
                                {expiresLabel(apiKey.expiresAt)}
                            </span>
                            <Button
                                variant="danger"
                                size="inline"
                                className="justify-self-end"
                                onClick={() => handleDeleteApiKey(apiKey.id)}
                            >
                                {t('account_page.developer.revoke')}
                            </Button>
                        </TableRow>
                    ))
                )}
            </Table>

            <div className="grid gap-1 max-w-content">
                <code className="font-mono text-xs text-faint break-all">
                    {`curl -H "Authorization: Bearer hemmelig_…" ${window.location.origin}/api/secrets`}
                </code>
                <span className="text-ui text-muted">
                    {t('account_page.developer.docs_hint')}{' '}
                    <a
                        href="/api/docs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                    >
                        {t('account_page.developer.api_docs')}
                    </a>
                </span>
            </div>
        </>
    );
}
