interface SegmentedOption<T extends string> {
    value: T;
    label: string;
}

interface SegmentedProps<T extends string> {
    options: SegmentedOption<T>[];
    value: T;
    onChange: (value: T) => void;
    mono?: boolean;
    label?: string;
}

/** A compact group of mutually exclusive buttons, for example a list filter. */
export function Segmented<T extends string>({
    options,
    value,
    onChange,
    mono = false,
    label,
}: SegmentedProps<T>) {
    return (
        <div
            role="group"
            aria-label={label}
            className="inline-flex gap-1 p-[3px] border border-line rounded-sm justify-self-start self-start"
        >
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={value === option.value}
                    onClick={() => onChange(option.value)}
                    className={`px-3 py-1 rounded-[3px] transition-colors cursor-pointer ${
                        mono ? 'font-mono text-xs' : 'text-ui'
                    } ${value === option.value ? 'bg-line text-fg' : 'text-muted hover:text-fg'}`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
