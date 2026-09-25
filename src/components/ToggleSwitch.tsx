interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    label?: string;
}

export function ToggleSwitch({ checked, onChange, disabled = false, label }: ToggleSwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className={`relative flex-none w-9 h-5 rounded-full transition-colors touch-manipulation ${
                checked ? 'bg-accent' : 'bg-line'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-fg shadow-sm transition-transform ${
                    checked ? 'translate-x-4' : 'translate-x-0'
                }`}
            />
        </button>
    );
}
