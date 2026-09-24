import { type ReactNode } from 'react';

interface Stat {
    label: string;
    value: ReactNode;
}

/** A row of stat tiles that share hairline borders. */
export function StatGrid({ stats }: { stats: Stat[] }) {
    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-px bg-line-soft border border-line-soft rounded-md overflow-hidden">
            {stats.map((stat) => (
                <div key={stat.label} className="bg-canvas px-4.5 py-4">
                    <div className="text-ui text-muted">{stat.label}</div>
                    <div className="font-mono text-2xl tracking-tight">{stat.value}</div>
                </div>
            ))}
        </div>
    );
}
