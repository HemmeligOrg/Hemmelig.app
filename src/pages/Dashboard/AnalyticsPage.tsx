import { useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { PageHeader } from '../../components/PageHeader';
import { Segmented } from '../../components/Segmented';
import { StatGrid } from '../../components/StatGrid';
import { Table, TableEmpty, TableHead, TableRow } from '../../components/Table';
import { api } from '../../lib/api';

interface DailyVisitor {
    date: string;
    unique_visitors: number;
    total_visits: number;
    paths: string;
}

interface DailyStat {
    date: string;
    secrets: number;
    views: number;
}

interface SecretTypes {
    passwordProtected: number;
    ipRestricted: number;
    burnable: number;
}

interface ExpirationStats {
    oneHour: number;
    oneDay: number;
    oneWeekPlus: number;
}

interface SecretRequestStats {
    total: number;
    fulfilled: number;
}

interface AnalyticsData {
    totalSecrets: number;
    totalViews: number;
    averageViews: number;
    activeSecrets: number;
    expiredSecrets: number;
    dailyStats: DailyStat[];
    secretTypes: SecretTypes;
    expirationStats: ExpirationStats;
    secretRequests: SecretRequestStats;
}

interface AnalyticsLoaderData extends Partial<AnalyticsData> {
    error?: string;
    visitorStats?: DailyVisitor[];
}

type TimeRange = '7d' | '14d' | '30d';

const RANGE_DAYS: Record<TimeRange, number> = { '7d': 7, '14d': 14, '30d': 30 };

interface DayPoint {
    date: string;
    secrets: number;
    views: number;
    uniqueVisitors: number;
    pageViews: number;
}

/** Returns the UTC calendar date (YYYY-MM-DD) of an API date value, or null. */
const toDayKey = (value: string): string | null => {
    const asNumber = Number(value);
    const date = Number.isFinite(asNumber) ? new Date(asNumber) : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

/**
 * Builds one point for each day in the range, oldest first.
 * The API sends only the days that have data. The missing days get zero.
 */
const buildDays = (
    range: TimeRange,
    dailyStats: DailyStat[],
    visitorStats: DailyVisitor[]
): DayPoint[] => {
    const days = new Map<string, DayPoint>();
    const today = new Date();
    for (let offset = RANGE_DAYS[range]; offset >= 0; offset--) {
        const date = new Date(
            Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset)
        )
            .toISOString()
            .slice(0, 10);
        days.set(date, { date, secrets: 0, views: 0, uniqueVisitors: 0, pageViews: 0 });
    }

    for (const stat of dailyStats) {
        const day = days.get(toDayKey(stat.date) ?? '');
        if (day) {
            day.secrets += stat.secrets;
            day.views += stat.views;
        }
    }

    for (const stat of visitorStats) {
        const day = days.get(toDayKey(stat.date) ?? '');
        if (day) {
            day.uniqueVisitors += stat.unique_visitors;
            day.pageViews += stat.total_visits;
        }
    }

    return [...days.values()];
};

interface DailyBarsProps {
    title: string;
    caption: string;
    points: { date: string; value: number }[];
    emptyText: string;
    keyboardHint: string;
    formatDate: (date: string) => string;
    formatNumber: (value: number) => string;
}

/**
 * A column chart with one column for each day. The latest day is in the
 * accent color. Hover or the arrow keys show the value of one day.
 */
function DailyBars({
    title,
    caption,
    points,
    emptyText,
    keyboardHint,
    formatDate,
    formatNumber,
}: DailyBarsProps) {
    const [active, setActive] = useState<number | null>(null);
    const max = Math.max(0, ...points.map((point) => point.value));
    const last = points.length - 1;
    const activePoint = active === null ? null : points[active];

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            setActive((index) => Math.max(0, (index ?? last) - 1));
        }
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            setActive((index) => Math.min(last, (index ?? last) + 1));
        }
        if (event.key === 'Escape') {
            setActive(null);
        }
    };

    // Keeps the readout inside the plot near the left and right edges.
    const readoutShift =
        active === null
            ? ''
            : active < points.length * 0.2
              ? 'translate-x-0'
              : active > points.length * 0.8
                ? '-translate-x-full'
                : '-translate-x-1/2';

    return (
        <div className="border border-line-soft rounded-md p-4.5 grid gap-3.5 content-start">
            <div className="flex justify-between gap-3 text-ui">
                <span>{title}</span>
                <span className="font-mono text-faint">{caption}</span>
            </div>

            {max === 0 ? (
                <div className="h-[166px] grid place-items-center text-ui text-muted border-b border-line-soft">
                    {emptyText}
                </div>
            ) : (
                <div
                    role="group"
                    tabIndex={0}
                    aria-label={`${title}. ${keyboardHint}`}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setActive((index) => index ?? last)}
                    onBlur={() => setActive(null)}
                    className="relative pt-4 rounded-xs outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                    <span className="absolute left-0 top-0 font-mono text-2xs text-faint tabular-nums">
                        {formatNumber(max)}
                    </span>
                    <div
                        className="flex items-end gap-[3px] h-[150px] border-t border-line-faint border-b border-b-line-soft"
                        onPointerLeave={() => setActive(null)}
                    >
                        {points.map((point, index) => (
                            <div
                                key={point.date}
                                className="flex-1 h-full flex items-end justify-center"
                                onPointerEnter={() => setActive(index)}
                            >
                                <div
                                    className={`w-full max-w-6 rounded-t-xs transition-colors ${
                                        index === last
                                            ? 'bg-accent'
                                            : index === active
                                              ? 'bg-line-strong'
                                              : 'bg-line'
                                    }`}
                                    style={{
                                        height:
                                            point.value > 0
                                                ? `max(2px, ${(point.value / max) * 100}%)`
                                                : 0,
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    {activePoint && active !== null && (
                        <div
                            aria-live="polite"
                            className={`absolute top-5 pointer-events-none bg-surface border border-line rounded-sm px-2 py-1 shadow-lg whitespace-nowrap ${readoutShift}`}
                            style={{ left: `${((active + 0.5) / points.length) * 100}%` }}
                        >
                            <div className="font-mono text-sm text-fg tabular-nums">
                                {formatNumber(activePoint.value)}
                            </div>
                            <div className="text-2xs text-muted">
                                {formatDate(activePoint.date)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-between font-mono text-2xs text-faint">
                <span>{points.length > 0 && formatDate(points[0].date)}</span>
                <span>{points.length > 0 && formatDate(points[last].date)}</span>
            </div>
        </div>
    );
}

interface ShareBarsProps {
    title: string;
    rows: { label: string; value: number }[];
    formatPercent: (value: number) => string;
}

/** A list of shares, each with a thin bar from 0 to 100 percent. */
function ShareBars({ title, rows, formatPercent }: ShareBarsProps) {
    return (
        <div className="border border-line-soft rounded-md p-4.5 grid gap-3.5 content-start">
            <div className="text-ui">{title}</div>
            {rows.map((row) => (
                <div key={row.label} className="grid gap-1.5">
                    <div className="flex justify-between gap-3 text-ui">
                        <span className="text-fg-3">{row.label}</span>
                        <span className="font-mono tabular-nums">{formatPercent(row.value)}</span>
                    </div>
                    <div className="h-1 bg-line-soft rounded-xs">
                        <div
                            className="h-1 bg-accent rounded-xs"
                            style={{ width: `${Math.min(100, Math.max(0, row.value))}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function AnalyticsPage() {
    const initialAnalytics = useLoaderData() as AnalyticsLoaderData;
    const { t } = useTranslation();
    const [timeRange, setTimeRange] = useState<TimeRange>('30d');
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(
        initialAnalytics.error ? null : (initialAnalytics as AnalyticsData)
    );
    const [visitorStats, setVisitorStats] = useState<DailyVisitor[]>(
        initialAnalytics.visitorStats || []
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(initialAnalytics.error || null);
    const [showTable, setShowTable] = useState(false);

    const locale = t('analytics_page.locale');
    const formatNumber = (value: number) => value.toLocaleString(locale);
    const formatPercent = (value: number) =>
        `${value.toLocaleString(locale, { maximumFractionDigits: 1 })}%`;
    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString(locale, {
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
        });
    const formatLongDate = (date: string) =>
        new Date(date).toLocaleDateString(locale, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
        });

    const fetchAnalytics = async (range: TimeRange) => {
        setLoading(true);
        try {
            const [analyticsRes, visitorRes] = await Promise.all([
                api.analytics.$get({ query: { timeRange: range } }),
                api.analytics.visitors.daily.$get({ query: { timeRange: range } }),
            ]);
            if (analyticsRes.status === 403) {
                toast.error(t('analytics_page.no_permission'));
                setAnalytics(null);
                setError(t('analytics_page.no_permission'));
                return;
            }
            if (!analyticsRes.ok) throw new Error('Failed to fetch');
            const data = await analyticsRes.json();
            setAnalytics(data as AnalyticsData);

            if (visitorRes.ok) {
                const visitorData = await visitorRes.json();
                setVisitorStats(visitorData as DailyVisitor[]);
            }

            setError(null);
        } catch {
            toast.error(t('analytics_page.failed_to_fetch'));
            setError(t('analytics_page.failed_to_fetch'));
        } finally {
            setLoading(false);
        }
    };

    const handleTimeRangeChange = (range: TimeRange) => {
        setTimeRange(range);
        fetchAnalytics(range);
    };

    const header = (
        <PageHeader
            title={t('analytics_page.title')}
            description={t('analytics_page.description')}
        />
    );

    if (error || !analytics) {
        return (
            <div className="grid gap-5 content-start">
                {header}
                <Notice tone="danger">{error ?? t('analytics_page.failed_to_fetch')}</Notice>
            </div>
        );
    }

    const days = buildDays(timeRange, analytics.dailyStats, visitorStats);
    const totalUniqueVisitors = visitorStats.reduce((acc, day) => acc + day.unique_visitors, 0);
    const totalPageViews = visitorStats.reduce((acc, day) => acc + day.total_visits, 0);
    const perDay = t('analytics_page.daily_activity.per_day');
    const keyboardHint = t('analytics_page.chart.keyboard_hint');
    const tableColumns = 'grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]';

    return (
        <div className="grid gap-5 content-start">
            {header}

            <Segmented
                mono
                label={t('analytics_page.range.label')}
                value={timeRange}
                onChange={handleTimeRangeChange}
                options={(['7d', '14d', '30d'] as const).map((range) => ({
                    value: range,
                    label: t(`analytics_page.range.${range}`),
                }))}
            />

            {/* The previous numbers stay visible at reduced opacity while new data loads. */}
            <div
                aria-busy={loading}
                className={`grid gap-5 content-start transition-opacity ${loading ? 'opacity-50' : ''}`}
            >
                <StatGrid
                    stats={[
                        {
                            label: t('analytics_page.daily_activity.secrets_created'),
                            value: formatNumber(analytics.totalSecrets),
                        },
                        {
                            label: t('analytics_page.total_views'),
                            value: formatNumber(analytics.totalViews),
                        },
                        {
                            label: t('analytics_page.visitor_analytics.unique_visitors'),
                            value: formatNumber(totalUniqueVisitors),
                        },
                        {
                            label: t('analytics_page.active_secrets'),
                            value: formatNumber(analytics.activeSecrets),
                        },
                    ]}
                />
                <StatGrid
                    stats={[
                        {
                            label: t('analytics_page.visitor_analytics.page_views'),
                            value: formatNumber(totalPageViews),
                        },
                        {
                            label: t('analytics_page.avg_views_per_secret'),
                            value: formatNumber(analytics.averageViews),
                        },
                        {
                            label: t('analytics_page.secret_requests.total'),
                            value: formatNumber(analytics.secretRequests?.total ?? 0),
                        },
                        {
                            label: t('analytics_page.secret_requests.fulfilled'),
                            value: formatNumber(analytics.secretRequests?.fulfilled ?? 0),
                        },
                    ]}
                />

                <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5">
                    <DailyBars
                        title={t('analytics_page.daily_activity.secrets_created')}
                        caption={perDay}
                        points={days.map((day) => ({ date: day.date, value: day.secrets }))}
                        emptyText={t('analytics_page.daily_activity.no_data')}
                        keyboardHint={keyboardHint}
                        formatDate={formatDate}
                        formatNumber={formatNumber}
                    />
                    <DailyBars
                        title={t('analytics_page.visitor_analytics.unique_visitors')}
                        caption={perDay}
                        points={days.map((day) => ({ date: day.date, value: day.uniqueVisitors }))}
                        emptyText={t('analytics_page.visitor_analytics.no_data')}
                        keyboardHint={keyboardHint}
                        formatDate={formatDate}
                        formatNumber={formatNumber}
                    />
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
                    <ShareBars
                        title={t('analytics_page.secret_types.title')}
                        formatPercent={formatPercent}
                        rows={[
                            {
                                label: t('analytics_page.secret_types.password_protected'),
                                value: analytics.secretTypes.passwordProtected,
                            },
                            {
                                label: t('analytics_page.secret_types.ip_restricted'),
                                value: analytics.secretTypes.ipRestricted,
                            },
                            {
                                label: t('analytics_page.secret_types.burn_after_time'),
                                value: analytics.secretTypes.burnable,
                            },
                        ]}
                    />
                    <ShareBars
                        title={t('analytics_page.expiration_stats.title')}
                        formatPercent={formatPercent}
                        rows={[
                            {
                                label: t('analytics_page.expiration_stats.one_hour'),
                                value: analytics.expirationStats.oneHour,
                            },
                            {
                                label: t('analytics_page.expiration_stats.one_day'),
                                value: analytics.expirationStats.oneDay,
                            },
                            {
                                label: t('analytics_page.expiration_stats.one_week_plus'),
                                value: analytics.expirationStats.oneWeekPlus,
                            },
                        ]}
                    />
                </div>

                <div className="grid gap-3">
                    <Button
                        variant="ghost"
                        size="inline"
                        className="justify-self-start"
                        aria-expanded={showTable}
                        onClick={() => setShowTable((value) => !value)}
                    >
                        {showTable
                            ? t('analytics_page.daily_table.hide')
                            : t('analytics_page.daily_table.show')}
                    </Button>
                    {showTable && (
                        <Table minWidthClassName="min-w-[560px]">
                            <TableHead className={tableColumns}>
                                <span>{t('analytics_page.daily_activity.date')}</span>
                                <span className="text-right">
                                    {t('analytics_page.daily_activity.secrets')}
                                </span>
                                <span className="text-right">
                                    {t('analytics_page.daily_activity.views')}
                                </span>
                                <span className="text-right">
                                    {t('analytics_page.visitor_analytics.unique_visitors')}
                                </span>
                                <span className="text-right">
                                    {t('analytics_page.visitor_analytics.page_views')}
                                </span>
                            </TableHead>
                            {days.length === 0 ? (
                                <TableEmpty>
                                    {t('analytics_page.daily_activity.no_data')}
                                </TableEmpty>
                            ) : (
                                [...days].reverse().map((day) => (
                                    <TableRow key={day.date} className={tableColumns}>
                                        <span className="text-ui">{formatLongDate(day.date)}</span>
                                        <span className="font-mono text-ui text-right tabular-nums">
                                            {formatNumber(day.secrets)}
                                        </span>
                                        <span className="font-mono text-ui text-right tabular-nums">
                                            {formatNumber(day.views)}
                                        </span>
                                        <span className="font-mono text-ui text-right tabular-nums">
                                            {formatNumber(day.uniqueVisitors)}
                                        </span>
                                        <span className="font-mono text-ui text-right tabular-nums">
                                            {formatNumber(day.pageViews)}
                                        </span>
                                    </TableRow>
                                ))
                            )}
                        </Table>
                    )}
                </div>
            </div>
        </div>
    );
}
