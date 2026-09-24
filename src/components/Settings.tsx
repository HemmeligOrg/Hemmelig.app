import { type ReactNode } from 'react';

/*
 * Parts for dashboard settings forms: a bordered panel with a label on the
 * left of each row and the control on the right.
 */

export function SettingsPanel({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`border border-line-soft rounded-md overflow-hidden max-w-content ${className}`}
        >
            {children}
        </div>
    );
}

export function SettingsHeading({ children }: { children: ReactNode }) {
    return (
        <div className="px-4.5 py-2.5 font-mono text-2xs text-faint uppercase tracking-wider bg-surface border-b border-line-soft">
            {children}
        </div>
    );
}

interface SettingRowProps {
    label: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    /** Dims the row, for example when the row depends on a switched-off toggle. */
    dim?: boolean;
    /** Puts the control below the label on every screen width. */
    stacked?: boolean;
}

export function SettingRow({
    label,
    description,
    children,
    dim = false,
    stacked = false,
}: SettingRowProps) {
    return (
        <div
            className={`flex flex-wrap gap-x-6 gap-y-2.5 justify-between items-center px-4.5 py-3.5 border-b border-line-faint ${
                dim ? 'opacity-45' : ''
            }`}
        >
            <div className={`${stacked ? 'basis-full' : 'flex-[1_1_220px]'} min-w-0`}>
                <div className="text-sm">{label}</div>
                {description && <div className="text-ui text-muted">{description}</div>}
            </div>
            {children && (
                <div
                    className={`${
                        stacked ? 'basis-full' : 'flex-[1_1_260px] justify-end'
                    } flex items-center gap-2 min-w-0`}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

interface SettingsFooterProps {
    note?: ReactNode;
    tone?: 'muted' | 'accent' | 'danger';
    children?: ReactNode;
}

const noteTones = {
    muted: 'text-muted',
    accent: 'text-accent',
    danger: 'text-danger',
};

export function SettingsFooter({ note, tone = 'muted', children }: SettingsFooterProps) {
    return (
        <div className="px-4.5 py-3 flex flex-wrap justify-between items-center gap-3">
            <span role="status" className={`text-ui ${noteTones[tone]}`}>
                {note}
            </span>
            {children}
        </div>
    );
}
