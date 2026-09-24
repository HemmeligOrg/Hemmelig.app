import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLoaderData } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, buttonClassName } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { Segmented } from '../../components/Segmented';
import { StatGrid } from '../../components/StatGrid';
import { Table, TableEmpty, TableHead, TableRow } from '../../components/Table';
import { Tag } from '../../components/Tag';
import { api } from '../../lib/api';

interface Secret {
    id: string;
    createdAt: Date;
    expiresAt?: Date;
    views: number | null;
    isPasswordProtected: boolean;
    url: string;
    ipRange?: string | null;
    isBurnable: boolean;
    fileCount: number;
    isExpired?: boolean;
}

interface SecretsLoaderData {
    data: Secret[];
}

type Filter = 'all' | 'active' | 'expired';

const COLUMNS = 'grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)_80px_110px_100px_64px]';

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
];

/** Formats a date relative to now, for example "2 minutes ago" or "in 3 days". */
const formatRelative = (date: Date, locale: string) => {
    const diffSeconds = (date.getTime() - Date.now()) / 1000;
    const absSeconds = Math.abs(diffSeconds);
    if (absSeconds >= 30 * 86400) {
        return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    }
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    for (const [unit, seconds] of RELATIVE_UNITS) {
        if (absSeconds >= seconds) {
            return formatter.format(Math.round(diffSeconds / seconds), unit);
        }
    }
    return formatter.format(0, 'second');
};

export function SecretsPage() {
    const rawData = useLoaderData() as SecretsLoaderData;
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage ?? i18n.language;
    const [secrets, setSecrets] = useState<Secret[]>([]);
    const [filter, setFilter] = useState<Filter>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [secretToDelete, setSecretToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (rawData?.data) {
            const now = new Date();
            setSecrets(
                rawData.data.map((secret) => {
                    const expiresAt = secret.expiresAt ? new Date(secret.expiresAt) : undefined;
                    return {
                        ...secret,
                        createdAt: new Date(secret.createdAt),
                        expiresAt,
                        url: `/secret/${secret.id}`,
                        isExpired: expiresAt ? expiresAt < now : false,
                    };
                })
            );
        }
    }, [rawData]);

    const openDeleteModal = (id: string) => {
        setSecretToDelete(id);
        setIsModalOpen(true);
    };

    const closeDeleteModal = () => {
        setSecretToDelete(null);
        setIsModalOpen(false);
    };

    const confirmDelete = async () => {
        if (!secretToDelete) return;
        const id = secretToDelete;
        try {
            const response = await api.secrets[':id'].$delete({ param: { id } });
            if (!response.ok) {
                throw new Error(`Delete request failed with status ${response.status}`);
            }
            setSecrets((current) => current.filter((secret) => secret.id !== id));
        } catch (error) {
            console.error('Failed to delete secret:', error);
            toast.error(t('secrets_page.toast.delete_error'));
        } finally {
            closeDeleteModal();
        }
    };

    const activeCount = secrets.filter((secret) => !secret.isExpired).length;
    const rows = secrets.filter((secret) => {
        if (filter === 'active') return !secret.isExpired;
        if (filter === 'expired') return secret.isExpired;
        return true;
    });

    const protectionTags = (secret: Secret) => {
        const tags: string[] = [];
        if (secret.isPasswordProtected) tags.push(t('secrets_page.tags.password'));
        if (secret.ipRange) tags.push(t('secrets_page.tags.ip'));
        if (secret.isBurnable) tags.push(t('secrets_page.tags.burn'));
        if (secret.fileCount > 0) {
            tags.push(t('secrets_page.tags.files', { count: secret.fileCount }));
        }
        return tags.length > 0 ? tags : [t('secrets_page.tags.link_key')];
    };

    const expiresLabel = (secret: Secret) => {
        if (!secret.expiresAt) return t('secrets_page.table.never_expires');
        if (secret.isExpired) return t('secrets_page.table.expired_time');
        return formatRelative(secret.expiresAt, locale);
    };

    return (
        <div className="grid gap-5 content-start">
            <PageHeader
                title={t('secrets_page.title')}
                description={t('secrets_page.description')}
                action={
                    <Link to="/" className={buttonClassName({ variant: 'primary' })}>
                        + {t('secrets_page.create_secret_button')}
                    </Link>
                }
            />

            <StatGrid
                stats={[
                    { label: t('secrets_page.stats.total'), value: secrets.length },
                    { label: t('secrets_page.stats.active'), value: activeCount },
                    {
                        label: t('secrets_page.stats.expired'),
                        value: secrets.length - activeCount,
                    },
                ]}
            />

            <Segmented<Filter>
                label={t('secrets_page.filter_label')}
                value={filter}
                onChange={setFilter}
                options={[
                    { value: 'all', label: t('secrets_page.filter.all') },
                    { value: 'active', label: t('secrets_page.filter.active') },
                    { value: 'expired', label: t('secrets_page.filter.expired') },
                ]}
            />

            <Table minWidthClassName="min-w-[780px]">
                <TableHead className={COLUMNS}>
                    <span>{t('secrets_page.table.id_header')}</span>
                    <span>{t('secrets_page.table.protection_header')}</span>
                    <span>{t('secrets_page.table.views_left_header')}</span>
                    <span>{t('secrets_page.table.expires_header')}</span>
                    <span>{t('secrets_page.table.created_header')}</span>
                    <span />
                </TableHead>
                {rows.map((secret) => (
                    <TableRow key={secret.id} className={COLUMNS} dim={secret.isExpired}>
                        <span className="font-mono text-ui truncate" title={secret.id}>
                            {secret.id}
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {protectionTags(secret).map((tag) => (
                                <Tag key={tag}>{tag}</Tag>
                            ))}
                        </div>
                        <span className="font-mono text-ui">{secret.views ?? '—'}</span>
                        <span
                            className={`text-ui ${secret.isExpired ? 'text-faint' : 'text-fg-3'}`}
                        >
                            {expiresLabel(secret)}
                        </span>
                        <span className="text-ui text-muted">
                            {formatRelative(secret.createdAt, locale)}
                        </span>
                        <Button
                            variant="danger"
                            size="inline"
                            className="justify-self-end"
                            title={t('secrets_page.table.delete_secret_tooltip')}
                            onClick={() => openDeleteModal(secret.id)}
                        >
                            {t('common.delete')}
                        </Button>
                    </TableRow>
                ))}
                {rows.length === 0 && <TableEmpty>{t('secrets_page.empty')}</TableEmpty>}
            </Table>

            <p className="m-0 text-ui text-faint">{t('secrets_page.footnote')}</p>

            <Modal
                isOpen={isModalOpen}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                title={t('secrets_page.table.delete_confirmation_title')}
                confirmText={t('secrets_page.table.delete_confirm_button')}
                cancelText={t('secrets_page.table.delete_cancel_button')}
            >
                <p className="m-0">{t('secrets_page.table.delete_confirmation_text')}</p>
            </Modal>
        </div>
    );
}
