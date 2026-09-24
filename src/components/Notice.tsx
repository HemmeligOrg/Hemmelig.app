import { type ReactNode } from 'react';

type NoticeTone = 'warn' | 'accent' | 'danger' | 'neutral';

const tones: Record<NoticeTone, string> = {
    warn: 'border-warn/35 bg-warn/8 text-warn',
    accent: 'border-accent/50 bg-surface text-fg',
    danger: 'border-danger/45 text-fg',
    neutral: 'border-line text-fg-3',
};

interface NoticeProps {
    tone?: NoticeTone;
    children: ReactNode;
    className?: string;
}

/** A tinted box for a status message, for example the managed-mode warning. */
export function Notice({ tone = 'neutral', children, className = '' }: NoticeProps) {
    return (
        <div className={`border rounded-md px-4 py-3 text-sm ${tones[tone]} ${className}`}>
            {children}
        </div>
    );
}
