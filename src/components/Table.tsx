import { type ReactNode } from 'react';

/*
 * Grid-based table parts. Pass the same `grid-cols-[...]` class to TableHead
 * and to every TableRow so that the columns line up.
 */

interface TableProps {
    children: ReactNode;
    /** Minimum inner width, for example `min-w-[780px]`. The table scrolls sideways below it. */
    minWidthClassName?: string;
    className?: string;
}

export function Table({ children, minWidthClassName = '', className = '' }: TableProps) {
    return (
        <div className={`border border-line-soft rounded-md overflow-x-auto ${className}`}>
            <div className={minWidthClassName}>{children}</div>
        </div>
    );
}

interface TablePartProps {
    children: ReactNode;
    className?: string;
}

export function TableHead({ children, className = '' }: TablePartProps) {
    return (
        <div
            className={`grid gap-4 px-4.5 py-2.5 font-mono text-2xs text-faint uppercase tracking-wider border-b border-line-soft ${className}`}
        >
            {children}
        </div>
    );
}

interface TableRowProps extends TablePartProps {
    /** Dims the row, for example for an expired or inactive item. */
    dim?: boolean;
}

export function TableRow({ children, className = '', dim = false }: TableRowProps) {
    return (
        <div
            className={`grid gap-4 px-4.5 py-3 border-b border-line-faint last:border-b-0 items-center text-sm ${
                dim ? 'opacity-50' : ''
            } ${className}`}
        >
            {children}
        </div>
    );
}

export function TableEmpty({ children }: { children: ReactNode }) {
    return <div className="px-4.5 py-7 text-sm text-muted">{children}</div>;
}
