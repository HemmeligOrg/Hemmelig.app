import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLoaderData } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, buttonClassName } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { Table, TableEmpty, TableHead, TableRow } from '../../components/Table';
import { api } from '../../lib/api';
import { copyToClipboard as copyText } from '../../utils/clipboard';

type SecretRequestStatus = 'pending' | 'fulfilled' | 'expired' | 'cancelled';

type SecretRequest = {
    id: string;
    title: string;
    description?: string;
    status: SecretRequestStatus;
    maxViews: number;
    expiresIn: number;
    webhookUrl?: string;
    createdAt: string;
    expiresAt: string;
    fulfilledAt?: string;
    secretId?: string;
};

type LoaderData = {
    data: SecretRequest[];
    meta: {
        total: number;
        page: number;
        totalPages: number;
    };
};

const COLUMNS = 'grid-cols-[minmax(0,2fr)_100px_110px_110px_170px]';

const STATUS_DOT: Record<SecretRequestStatus, string> = {
    pending: 'bg-warn',
    fulfilled: 'bg-accent',
    expired: 'bg-faint',
    cancelled: 'bg-faint',
};

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

export function SecretRequestsPage() {
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage ?? i18n.language;
    const loaderData = useLoaderData() as LoaderData;
    const [requests, setRequests] = useState<SecretRequest[]>(loaderData?.data || []);
    const [requestToCancel, setRequestToCancel] = useState<SecretRequest | null>(null);
    const [requestToView, setRequestToView] = useState<SecretRequest | null>(null);
    const [creatorLink, setCreatorLink] = useState<string | null>(null);

    const fetchCreatorLink = async (request: SecretRequest) => {
        try {
            const res = await api['secret-requests'][':id'].$get({ param: { id: request.id } });
            if (res.ok) {
                const data = await res.json();
                setCreatorLink(data.creatorLink || null);
                setRequestToView(request);
            }
        } catch (error) {
            console.error('Failed to fetch creator link:', error);
            toast.error(t('secret_requests_page.toast.fetch_error'));
        }
    };

    const cancelRequest = async () => {
        if (!requestToCancel) return;
        try {
            const res = await api['secret-requests'][':id'].$delete({
                param: { id: requestToCancel.id },
            });
            if (res.ok) {
                setRequests(
                    requests.map((r) =>
                        r.id === requestToCancel.id ? { ...r, status: 'cancelled' as const } : r
                    )
                );
                setRequestToCancel(null);
                toast.success(t('secret_requests_page.toast.cancelled'));
            }
        } catch (error) {
            console.error('Failed to cancel request:', error);
            toast.error(t('secret_requests_page.toast.cancel_error'));
        }
    };

    const handleCopyToClipboard = async (text: string) => {
        const success = await copyText(text);
        if (success) {
            toast.success(t('secret_requests_page.toast.copied'));
        }
    };

    const formatExpiration = (seconds: number) => {
        if (seconds >= 86400) {
            const days = Math.floor(seconds / 86400);
            return t('secret_requests_page.time.days', { count: days });
        } else if (seconds >= 3600) {
            const hours = Math.floor(seconds / 3600);
            return t('secret_requests_page.time.hours', { count: hours });
        } else {
            const minutes = Math.floor(seconds / 60);
            return t('secret_requests_page.time.minutes', { count: minutes });
        }
    };

    return (
        <div className="grid gap-5 content-start">
            <PageHeader
                title={t('secret_requests_page.title')}
                description={t('secret_requests_page.description')}
                action={
                    <Link
                        to="/dashboard/secret-requests/create"
                        className={buttonClassName({ variant: 'primary' })}
                    >
                        + {t('secret_requests_page.create_request_button')}
                    </Link>
                }
            />

            <Table minWidthClassName="min-w-[720px]">
                <TableHead className={COLUMNS}>
                    <span>{t('secret_requests_page.table.request_header')}</span>
                    <span>{t('secret_requests_page.table.status_header')}</span>
                    <span>{t('secret_requests_page.table.created_header')}</span>
                    <span>{t('secret_requests_page.table.link_expires_header')}</span>
                    <span />
                </TableHead>
                {requests.map((request) => {
                    // A pending request with a past link expiry counts as expired.
                    const isLinkExpired = new Date(request.expiresAt) < new Date();
                    const status: SecretRequestStatus =
                        request.status === 'pending' && isLinkExpired ? 'expired' : request.status;
                    const isPending = status === 'pending';
                    const meta = t('secret_requests_page.table.meta', {
                        views: t('secret_requests_page.table.views', { count: request.maxViews }),
                        expiry: formatExpiration(request.expiresIn),
                    });

                    return (
                        <TableRow
                            key={request.id}
                            className={COLUMNS}
                            dim={status === 'expired' || status === 'cancelled'}
                        >
                            <div className="min-w-0">
                                <div className="truncate" title={request.description}>
                                    {request.title}
                                </div>
                                <div className="text-xs text-faint truncate">{meta}</div>
                            </div>
                            <span className="flex items-center gap-2 font-mono text-xs">
                                <span
                                    aria-hidden="true"
                                    className={`flex-none w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`}
                                />
                                {t(`secret_requests_page.status.${status}`)}
                            </span>
                            <span className="text-ui text-muted">
                                {formatRelative(new Date(request.createdAt), locale)}
                            </span>
                            <span className="text-ui text-fg-3">
                                {isPending
                                    ? formatRelative(new Date(request.expiresAt), locale)
                                    : '—'}
                            </span>
                            <div className="flex gap-3.5 justify-end">
                                {isPending && (
                                    <>
                                        <Button
                                            variant="link"
                                            size="inline"
                                            title={t(
                                                'secret_requests_page.table.copy_link_tooltip'
                                            )}
                                            onClick={() => fetchCreatorLink(request)}
                                        >
                                            {t('secret_requests_page.table.copy_link')}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="inline"
                                            title={t('secret_requests_page.table.cancel_tooltip')}
                                            onClick={() => setRequestToCancel(request)}
                                        >
                                            {t('secret_requests_page.table.cancel')}
                                        </Button>
                                    </>
                                )}
                                {request.status === 'fulfilled' && request.secretId && (
                                    <a
                                        href={`/secret/${request.secretId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={t('secret_requests_page.table.view_secret_tooltip')}
                                        className={buttonClassName({
                                            variant: 'link',
                                            size: 'inline',
                                        })}
                                    >
                                        {t('secret_requests_page.table.open_with_key')}
                                    </a>
                                )}
                            </div>
                        </TableRow>
                    );
                })}
                {requests.length === 0 && (
                    <TableEmpty>{t('secret_requests_page.no_requests')}</TableEmpty>
                )}
            </Table>

            <p className="m-0 text-ui text-faint">{t('secret_requests_page.footnote')}</p>

            {/* Creator link modal */}
            <Modal
                isOpen={!!requestToView}
                onClose={() => {
                    setRequestToView(null);
                    setCreatorLink(null);
                }}
                onConfirm={() => {
                    if (creatorLink) handleCopyToClipboard(creatorLink);
                }}
                title={t('secret_requests_page.link_modal.title')}
                confirmText={t('secret_requests_page.link_modal.copy_button')}
                cancelText={t('secret_requests_page.link_modal.close_button')}
                confirmVariant="primary"
            >
                <div className="grid gap-3">
                    <p className="m-0">{t('secret_requests_page.link_modal.description')}</p>
                    {creatorLink && (
                        <div className="bg-canvas border border-line-soft rounded-sm p-2.5 font-mono text-xs text-fg break-all">
                            {creatorLink}
                        </div>
                    )}
                    <p className="m-0 text-xs text-warn">
                        {t('secret_requests_page.link_modal.warning')}
                    </p>
                </div>
            </Modal>

            {/* Cancel request modal */}
            <Modal
                isOpen={!!requestToCancel}
                onClose={() => setRequestToCancel(null)}
                onConfirm={cancelRequest}
                title={t('secret_requests_page.cancel_modal.title')}
                confirmText={t('secret_requests_page.cancel_modal.confirm_text')}
                cancelText={t('secret_requests_page.cancel_modal.cancel_text')}
            >
                <p className="m-0">
                    {t('secret_requests_page.cancel_modal.message', {
                        title: requestToCancel?.title,
                    })}
                </p>
            </Modal>
        </div>
    );
}
