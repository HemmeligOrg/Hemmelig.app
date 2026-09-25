import { type ReactNode } from 'react';

/** A small bordered label in the mono font, for example a protection flag. */
export function Tag({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <span
            className={`inline-block font-mono text-2xs px-1.5 py-px border border-line rounded-[3px] text-fg-3 whitespace-nowrap ${className}`}
        >
            {children}
        </span>
    );
}
