import { type ReactNode } from 'react';

interface ChipProps {
    selected: boolean;
    onClick: () => void;
    children: ReactNode;
}

/** A small selectable option, for example an expiration choice. */
export function Chip({ selected, onClick, children }: ChipProps) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className={`px-2 py-1 rounded-sm border font-mono text-xs transition-colors cursor-pointer ${
                selected
                    ? 'bg-accent/12 text-accent border-accent'
                    : 'border-line text-muted hover:text-fg hover:border-line-strong'
            }`}
        >
            {children}
        </button>
    );
}
