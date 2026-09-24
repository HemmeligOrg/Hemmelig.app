import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLoaderData } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, buttonClassName } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Notice } from '../../components/Notice';
import { PageHeader } from '../../components/PageHeader';
import { Table, TableEmpty, TableHead, TableRow } from '../../components/Table';
import { useCopyFeedbackWithId } from '../../hooks/useCopyFeedback';
import { api } from '../../lib/api';
import { useHemmeligStore } from '../../store/hemmeligStore';

type InviteCode = {
    id: string;
    code: string;
    uses: number;
    maxUses: number | null;
    expiresAt: string | null;
    createdAt: string;
    isActive: boolean;
};

const COLUMNS = 'grid-cols-[minmax(0,1.4fr)_90px_120px_90px_160px]';

/** Expiry choices in days. `null` means that the code does not expire. */
const EXPIRY_DAYS: (number | null)[] = [1, 7, 30, null];

const MAX_USES_LIMIT = 100;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Formats a date relative to now, for example "in 6 days", in the active language. */
const formatRelative = (iso: string, language: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    const format = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
    if (Math.abs(diff) < DAY_MS) {
        return format.format(Math.round(diff / HOUR_MS), 'hour');
    }
    return format.format(Math.round(diff / DAY_MS), 'day');
};

export function InvitesPage() {
    const { t, i18n } = useTranslation();
    const initialInvites = useLoaderData() as InviteCode[];
    const requireInviteCode = useHemmeligStore((state) => state.settings.requireInviteCode);
    const [invites, setInvites] = useState<InviteCode[]>(initialInvites || []);
    const [showForm, setShowForm] = useState(false);
    const [maxUses, setMaxUses] = useState('1');
    const [expiresInDays, setExpiresInDays] = useState<number | null>(7);
    const [isCreating, setIsCreating] = useState(false);
    const [inviteToDelete, setInviteToDelete] = useState<InviteCode | null>(null);
    const { copy, isCopied } = useCopyFeedbackWithId();

    const language = i18n.resolvedLanguage ?? i18n.language;

    const createInvite = async () => {
        const uses = Math.min(MAX_USES_LIMIT, Math.max(1, parseInt(maxUses, 10) || 1));
        setIsCreating(true);
        try {
            const res = await api.invites.$post({
                json: { maxUses: uses, ...(expiresInDays ? { expiresInDays } : {}) },
            });
            if (res.ok) {
                const newInvite = await res.json();
                setInvites([newInvite, ...invites]);
                setShowForm(false);
                toast.success(t('invites_page.toast.created'));
            } else {
                toast.error(t('invites_page.toast.create_error'));
            }
        } catch (error) {
            console.error('Failed to create invite:', error);
            toast.error(t('invites_page.toast.create_error'));
        } finally {
            setIsCreating(false);
        }
    };

    const deleteInvite = async () => {
        if (!inviteToDelete) return;
        try {
            const res = await api.invites[':id'].$delete({
                param: { id: inviteToDelete.id },
            });
            if (res.ok) {
                setInvites(invites.filter((i) => i.id !== inviteToDelete.id));
                setInviteToDelete(null);
                toast.success(t('invites_page.toast.deactivated'));
            }
        } catch (error) {
            console.error('Failed to delete invite:', error);
            toast.error(t('invites_page.toast.delete_error'));
        }
    };

    return (
        <div className="grid gap-5 content-start">
            <PageHeader
                title={t('invites_page.title')}
                description={t('invites_page.description')}
                action={
                    requireInviteCode && (
                        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
                            {showForm
                                ? t('invites_page.close')
                                : t('invites_page.create_invite_button')}
                        </Button>
                    )
                }
            />

            {!requireInviteCode && (
                <Notice className="flex flex-wrap gap-4 items-center justify-between">
                    <span>{t('invites_page.invites_off')}</span>
                    <Link
                        to="/dashboard/instance?tab=organization"
                        className={buttonClassName({ variant: 'link', size: 'inline' })}
                    >
                        {t('invites_page.require_invite_code')}
                    </Link>
                </Notice>
            )}

            {showForm && requireInviteCode && (
                <div className="border border-line rounded-md p-3.5 flex flex-wrap gap-2.5 items-center">
                    <span className="text-ui text-muted">{t('invites_page.form.max_uses')}</span>
                    <div className="w-[70px]">
                        <Input
                            mono
                            inputMode="numeric"
                            value={maxUses}
                            onChange={(e) => setMaxUses(e.target.value.replace(/\D/g, ''))}
                            aria-label={t('invites_page.form.max_uses')}
                            className="text-right"
                        />
                    </div>
                    <span className="text-ui text-muted">{t('invites_page.form.expires_in')}</span>
                    <div className="flex gap-1">
                        {EXPIRY_DAYS.map((days) => (
                            <Chip
                                key={days ?? 'never'}
                                selected={expiresInDays === days}
                                onClick={() => setExpiresInDays(days)}
                            >
                                {days
                                    ? t('invites_page.form.days', { count: days })
                                    : t('invites_page.form.never')}
                            </Chip>
                        ))}
                    </div>
                    <Button
                        variant="primary"
                        className="ml-auto"
                        loading={isCreating}
                        onClick={createInvite}
                    >
                        {t('invites_page.form.generate')}
                    </Button>
                </div>
            )}

            <Table minWidthClassName="min-w-[640px]">
                <TableHead className={COLUMNS}>
                    <span>{t('invites_page.table.code_header')}</span>
                    <span>{t('invites_page.table.uses_header')}</span>
                    <span>{t('invites_page.table.expires_header')}</span>
                    <span>{t('invites_page.table.status_header')}</span>
                    <span />
                </TableHead>
                {invites.length === 0 ? (
                    <TableEmpty>{t('invites_page.no_invites')}</TableEmpty>
                ) : (
                    invites.map((invite) => {
                        const isExpired =
                            !!invite.expiresAt && new Date(invite.expiresAt) < new Date();
                        const isMaxedOut = !!invite.maxUses && invite.uses >= invite.maxUses;
                        const isValid = invite.isActive && !isExpired && !isMaxedOut;
                        const status = isValid
                            ? t('invites_page.status.active')
                            : !invite.isActive
                              ? t('invites_page.status.inactive')
                              : isExpired
                                ? t('invites_page.status.expired')
                                : t('invites_page.status.used');

                        return (
                            <TableRow key={invite.id} className={COLUMNS} dim={!isValid}>
                                <span className="font-mono text-sm truncate">{invite.code}</span>
                                <span className="font-mono text-ui text-fg-3">
                                    {invite.uses} / {invite.maxUses ?? '∞'}
                                </span>
                                <span className="text-ui text-muted">
                                    {invite.expiresAt
                                        ? formatRelative(invite.expiresAt, language)
                                        : t('invites_page.table.never')}
                                </span>
                                <span
                                    className={`font-mono text-xs ${isValid ? 'text-accent' : 'text-faint'}`}
                                >
                                    {status}
                                </span>
                                <div className="flex gap-3.5 justify-end">
                                    <Button
                                        variant="link"
                                        size="inline"
                                        onClick={() => copy(invite.code, invite.id)}
                                    >
                                        {isCopied(invite.id)
                                            ? t('invites_page.copied')
                                            : t('invites_page.copy')}
                                    </Button>
                                    {invite.isActive && (
                                        <Button
                                            variant="ghost"
                                            size="inline"
                                            onClick={() => setInviteToDelete(invite)}
                                        >
                                            {t('invites_page.delete_modal.confirm_text')}
                                        </Button>
                                    )}
                                </div>
                            </TableRow>
                        );
                    })
                )}
            </Table>

            <Modal
                isOpen={!!inviteToDelete}
                onClose={() => setInviteToDelete(null)}
                onConfirm={deleteInvite}
                title={t('invites_page.delete_modal.title')}
                confirmText={t('invites_page.delete_modal.confirm_text')}
                cancelText={t('invites_page.delete_modal.cancel_text')}
            >
                <p>{t('invites_page.delete_modal.message', { code: inviteToDelete?.code })}</p>
            </Modal>
        </div>
    );
}
