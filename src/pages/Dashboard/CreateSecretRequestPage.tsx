import { ArrowLeft, Copy, Link2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { copyToClipboard as copyText } from '../../utils/clipboard';

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
    webhookSecret?: string;
    expiresAt: string;
}

export function CreateSecretRequestPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

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

    const handleCopyToClipboard = async (text: string) => {
        const success = await copyText(text);
        if (success) {
            toast.success(t('create_request_page.toast.copied'));
        }
    };

    if (createdRequest) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-6 sm:p-8">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-teal-500/20 flex items-center justify-center">
                                <Link2 className="w-6 h-6 text-teal-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {t('create_request_page.success.title')}
                                </h2>
                                <p className="text-gray-500 dark:text-slate-400">
                                    {t('create_request_page.success.description')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                    {t('create_request_page.success.creator_link_label')}
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-100 dark:bg-dark-700 p-3 overflow-x-auto">
                                        <code className="text-sm text-gray-900 dark:text-white break-all">
                                            {createdRequest.creatorLink}
                                        </code>
                                    </div>
                                    <button
                                        onClick={() =>
                                            handleCopyToClipboard(createdRequest.creatorLink)
                                        }
                                        className="p-3 bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {createdRequest.webhookSecret && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                        {t('create_request_page.success.webhook_secret_label')}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-100 dark:bg-dark-700 p-3 overflow-x-auto">
                                            <code className="text-sm text-gray-900 dark:text-white break-all">
                                                {createdRequest.webhookSecret}
                                            </code>
                                        </div>
                                        <button
                                            onClick={() =>
                                                handleCopyToClipboard(createdRequest.webhookSecret!)
                                            }
                                            className="p-3 bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                                        {t('create_request_page.success.webhook_secret_warning')}
                                    </p>
                                </div>
                            )}

                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {t('create_request_page.success.expires_at', {
                                    date: new Date(createdRequest.expiresAt).toLocaleString(),
                                })}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setCreatedRequest(null);
                                        setTitle('');
                                        setDescription('');
                                        setAllowedIp('');
                                        setWebhookUrl('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                                >
                                    {t('create_request_page.success.create_another_button')}
                                </button>
                                <Link
                                    to="/dashboard/secret-requests"
                                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-dark-600 hover:bg-gray-300 dark:hover:bg-dark-500 text-gray-900 dark:text-white text-center transition-colors"
                                >
                                    {t('create_request_page.success.view_all_button')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Link
                        to="/dashboard/secret-requests"
                        className="inline-flex items-center text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {t('create_request_page.back_button')}
                    </Link>
                </div>

                <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 p-6 sm:p-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {t('create_request_page.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 mb-6">
                        {t('create_request_page.description')}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                {t('create_request_page.form.title_label')} *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={t('create_request_page.form.title_placeholder')}
                                required
                                maxLength={200}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                {t('create_request_page.form.description_label')}
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('create_request_page.form.description_placeholder')}
                                rows={3}
                                maxLength={1000}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
                            />
                        </div>

                        {/* Link Validity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                {t('create_request_page.form.link_validity_label')}
                            </label>
                            <select
                                value={validFor}
                                onChange={(e) => setValidFor(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                            >
                                {REQUEST_VALIDITY_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {t(option.labelKey)}
                                    </option>
                                ))}
                            </select>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                {t('create_request_page.form.link_validity_hint')}
                            </p>
                        </div>

                        <div className="border-t border-gray-200 dark:border-dark-600 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                {t('create_request_page.form.secret_settings_title')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                                {t('create_request_page.form.secret_settings_description')}
                            </p>

                            <div className="space-y-4">
                                {/* Secret Expiration */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                        {t('create_request_page.form.secret_expiration_label')}
                                    </label>
                                    <select
                                        value={expiresIn}
                                        onChange={(e) => setExpiresIn(Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                    >
                                        {SECRET_EXPIRATION_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {t(option.labelKey)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Max Views */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                        {t('create_request_page.form.max_views_label')}
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={9999}
                                        value={maxViews}
                                        onChange={(e) => setMaxViews(parseInt(e.target.value) || 1)}
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                    />
                                </div>

                                {/* IP Restriction */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                        {t('create_request_page.form.ip_restriction_label')}
                                    </label>
                                    <input
                                        type="text"
                                        value={allowedIp}
                                        onChange={(e) => setAllowedIp(e.target.value)}
                                        placeholder={t(
                                            'create_request_page.form.ip_restriction_placeholder'
                                        )}
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                    />
                                </div>

                                {/* Prevent Burn */}
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="preventBurn"
                                        checked={preventBurn}
                                        onChange={(e) => setPreventBurn(e.target.checked)}
                                        className="w-4 h-4 text-teal-500 border-gray-300 dark:border-dark-500 focus:ring-teal-500"
                                    />
                                    <label
                                        htmlFor="preventBurn"
                                        className="text-sm text-gray-600 dark:text-slate-300"
                                    >
                                        {t('create_request_page.form.prevent_burn_label')}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Webhook Settings */}
                        <div className="border-t border-gray-200 dark:border-dark-600 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                {t('create_request_page.form.webhook_title')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                                {t('create_request_page.form.webhook_description')}
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                                    {t('create_request_page.form.webhook_url_label')}
                                </label>
                                <input
                                    type="url"
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    placeholder={t(
                                        'create_request_page.form.webhook_url_placeholder'
                                    )}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                />
                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                    {t('create_request_page.form.webhook_url_hint')}
                                </p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading || !title.trim()}
                                className="w-full px-4 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-colors"
                            >
                                {isLoading
                                    ? t('create_request_page.form.creating_button')
                                    : t('create_request_page.form.create_button')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
