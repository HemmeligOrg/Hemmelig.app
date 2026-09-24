interface Tab<T extends string> {
    id: T;
    label: string;
}

interface TabsProps<T extends string> {
    tabs: Tab<T>[];
    active: T;
    onChange: (id: T) => void;
}

/** Underlined sub-navigation tabs for a dashboard page. */
export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
    return (
        <div role="tablist" className="flex gap-5.5 border-b border-line-soft overflow-x-auto">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active === tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`-mb-px pb-2.5 border-b-2 text-sm whitespace-nowrap transition-colors cursor-pointer ${
                        active === tab.id
                            ? 'border-accent text-fg'
                            : 'border-transparent text-muted hover:text-fg'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
