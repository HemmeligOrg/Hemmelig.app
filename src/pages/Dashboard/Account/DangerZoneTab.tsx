import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { api } from '../../../lib/api';
import { useAccountStore } from '../../../store/accountStore';
import { useUserStore } from '../../../store/userStore';

export function DangerZoneTab() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const sessionUsername = useUserStore((s) => s.user?.username);
    const profileUsername = useAccountStore((s) => s.profileData.username);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [error, setError] = useState('');

    // Use the saved username. The profile form can hold unsaved edits.
    const username = sessionUsername || profileUsername;
    const canDelete = !!username && confirmText === username && !isLoading;

    const handleDeleteAccount = async () => {
        if (!canDelete) return;
        setIsLoading(true);
        setError('');
        try {
            const res = await api.account.$delete();
            if (res.ok) {
                navigate('/login');
            } else {
                setError(t('account_page.danger_zone.delete_error'));
            }
        } catch (err) {
            console.error('An error occurred', err);
            setError(t('account_page.danger_zone.delete_error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="border border-danger/45 rounded-md p-4.5 grid gap-3 max-w-content">
            <div>
                <div className="text-sm">{t('account_page.danger_zone.delete_account_title')}</div>
                <div className="text-ui text-muted">
                    {t('account_page.danger_zone.delete_account_summary')}
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <Input
                    mono
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDeleteAccount()}
                    placeholder={t('account_page.danger_zone.confirm_placeholder', { username })}
                    aria-label={t('account_page.danger_zone.confirm_placeholder', { username })}
                    autoComplete="off"
                    className="flex-1 min-w-[200px]"
                />
                <Button
                    variant="danger-solid"
                    onClick={handleDeleteAccount}
                    disabled={!canDelete}
                    loading={isLoading}
                >
                    {isLoading
                        ? t('account_page.danger_zone.deleting_account_button')
                        : t('account_page.danger_zone.delete_account_button')}
                </Button>
            </div>
            {error && <div className="text-ui text-danger">{error}</div>}
        </div>
    );
}
