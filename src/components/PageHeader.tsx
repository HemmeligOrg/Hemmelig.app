import { type ReactNode } from 'react';

interface PageHeaderProps {
    title: ReactNode;
    description?: ReactNode;
    /** An optional button or link on the right, for example "+ New request". */
    action?: ReactNode;
}

/** The title row at the top of a dashboard page. */
export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <div className="flex flex-wrap justify-between items-end gap-4">
            <div>
                <h1 className="m-0 text-2xl font-medium tracking-tight">{title}</h1>
                {description && <div className="text-sm text-muted">{description}</div>}
            </div>
            {action}
        </div>
    );
}
