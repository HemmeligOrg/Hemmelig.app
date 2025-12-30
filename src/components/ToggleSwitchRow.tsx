interface ToggleSwitchRowProps {
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export function ToggleSwitchRow({
    title,
    description,
    checked,
    onChange,
    disabled = false,
}: ToggleSwitchRowProps) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/30">
            <div className="flex-1 min-w-0 mr-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">{description}</p>
            </div>
            <label
                className={`relative inline-flex items-center flex-shrink-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                    className="sr-only peer"
                />
                <div
                    className={`w-9 h-5 bg-gray-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/50 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 ${disabled ? 'opacity-60' : ''}`}
                ></div>
            </label>
        </div>
    );
}
