import { ToggleSwitch } from './ToggleSwitch';

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
            <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
        </div>
    );
}
